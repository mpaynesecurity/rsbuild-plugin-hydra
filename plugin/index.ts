import type { RsbuildPlugin } from "@rsbuild/core"
import { Context } from "hono"
import MagicString from "magic-string"
import { mkdir, readFile } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "pathe"

interface PluginOptions {
	/**
	 * Path where Hono api routes are stored
	 */
	apiDirectory: string
	/**
	 * Where the auto-generated Hono routes file is places
	 * @default api-routes.gen.ts
	 */
	generatedRoutesFile?: string
}

export const hydra = (options: PluginOptions): RsbuildPlugin => {
	const generatedRoutesFile = options.generatedRoutesFile || "api.routes.ts"
	
	const generatedRoutesFilePath = resolve(generatedRoutesFile)
	
	let isRouterFileWriting = false
	
	// --- 1. DEV ROUTER FILE GENERATION ---
	const buildPhysicalRouterFile = async () => {
		if( isRouterFileWriting ) return
		isRouterFileWriting = true
		
		try {
			//const apiFiles = glob("**/*.{ts,js}", { cwd: resolve(options.apiDirectory) })
			const apiGlobber = new Bun.Glob("**/*.{ts,js}")
			const apiFiles = apiGlobber.scan({ cwd: resolve(options.apiDirectory) })
			
			const generatedRoutesOutputDir = dirname(generatedRoutesFilePath)
			
			const codeLines = new MagicString("").append(`import { Hono } from "hono"\nexport const app = new Hono().basePath("/api")\n`)
			
			for await ( const f of apiFiles ) {
				const randomApiFileId = Bun.hash(f).toString(36).slice(0, 8)
				const importNamespace = `route_${ randomApiFileId }`
				
				const absoluteTarget = resolve(options.apiDirectory, f)
				let relativePath = relative(generatedRoutesOutputDir, absoluteTarget).replace(/\\/g, "/")
				
				if( !relativePath.startsWith(".") ) {
					relativePath = `./${ relativePath }`
				}
				
				const extName = extname(relativePath)
				if( extName ) {
					relativePath = relativePath.slice(0, -extName.length)
				}
				
				// append the resolved namespace and relative path (file containing the Hono route)
				codeLines.append(`\nimport * as ${ importNamespace } from "${ relativePath }.ts"\n`)
				
				let urlPath = f.slice(0, -extname(f).length).replace(/\\/g, "/")
				urlPath = urlPath.replace(/\[([^\]]+)\]/g, ":$1")
				const cleanRoute = urlPath === "index" ? "/" : `/${ urlPath }`
				
				codeLines.append(`if (${ importNamespace } && typeof ${ importNamespace }.default.fetch === "function") {\n`)
				         .append(`\tapp.route("${ cleanRoute }", ${ importNamespace }.default)\n}\n`)
			}
			
			await mkdir(generatedRoutesOutputDir, { recursive: true })
			//await writeFile(generatedRoutesFilePath, codeLines.toString())
			
			await Bun.write(generatedRoutesFilePath, codeLines.toString())
			
		}
		finally {
			isRouterFileWriting = false
		}
	}
	
	return {
		name: "rsbuild-plugin-hydra",
		// --- 2. COMPILER HOOK REGISTRATIONS ---
		async setup(api) {
			
			api.onBeforeBuild(async () => {
				await buildPhysicalRouterFile()
			})
			// --- AUTOMATED SERVER WATCHER FOR API DIRECTORY ---
			api.modifyRsbuildConfig((config) => {
				// Initialize the dev config object if it doesn't exist
				config.dev = config.dev || {}
				
				// Enforce an array structure so we don't accidentally overwrite
				// other watch files the user might have configured manually
				const existingWatchFiles = Array.isArray(config.dev.watchFiles)
				                           ? config.dev.watchFiles
				                           : config.dev.watchFiles
				                             ? [ config.dev.watchFiles ]
				                             : []
				
				config.dev.watchFiles = [
					...existingWatchFiles,
					{
						type: "reload-server", // Forces a full native Node CLI process reboot
						paths: [ `${ resolve(options.apiDirectory) }/**/*` ],
					},
				]
			})
			
			api.onBeforeStartDevServer(async () => {
				await buildPhysicalRouterFile()
			})
			
			// --- 3. DEVELOPMENT ---
			api.onBeforeStartDevServer(({ server }) => {
				server.middlewares.use(async (req, res, next) => {
					const protocol = req.headers["x-forwarded-proto"] || "http"
					const host = req.headers.host || "localhost"
					
					const rawUrl = req.originalUrl || req.url || ""
					const parsedUrlContext = new URL(rawUrl, `${ protocol }://${ host }`)
					
					// 1. Fast path exit for standard static asset traffic
					if( !parsedUrlContext.pathname.startsWith("/api") ) {
						return next()
					}
					
					try {
						const fileUrl = Bun.pathToFileURL(generatedRoutesFilePath).href
						const cacheBustUrl = `${ fileUrl }?update=${ Date.now() }`
						const importedModule = await import(cacheBustUrl)
						
						const appInstance = importedModule?.app || importedModule?.default
						
						if( !appInstance || typeof appInstance.fetch !== "function" ) {
							console.warn(`[Hydra] Could not resolve a valid Hono instance from ${ generatedRoutesFilePath }`)
							return next()
						}
						
						if( typeof appInstance.notFound === "function" ) {
							appInstance.notFound((c: Context) => c.json({ error: "Hono Dev 404: Route not matched", path: c.req.path }, 404))
						}
						
						// 2. Convert incoming Node stream headers into a Web standard Headers object
						const webHeaders = new Headers()
						for( const [ key, value ] of Object.entries(req.headers) ) {
							if( value === undefined ) continue
							if( Array.isArray(value) ) {
								value.forEach(v => webHeaders.append(key, v))
							}
							else {
								webHeaders.set(key, value)
							}
						}
						
						// 3. Construct a standard Web API Request object out of the incoming Node metadata
						const webRequest = new Request(parsedUrlContext.href, {
							method: req.method,
							headers: webHeaders,
							// Cast through any to satisfy TypeScript's strict BodyInit constraints
							body: [ "GET", "HEAD" ].includes(req.method || "") ? undefined : (req as any),
						})
						
						// 4. Fire the request directly into Hono's agnostic fetch pipeline
						const webResponse: Response = await appInstance.fetch(webRequest)
						
						// 5. Pipe the standard Web Response properties back into the outgoing Node network socket
						res.statusCode = webResponse.status
						
						webResponse.headers.forEach((value, key) => {
							res.setHeader(key, value)
						})
						
						// Stream the body chunks back out to the browser
						if( webResponse.body ) {
							const reader = webResponse.body.getReader()
							while( true ) {
								const { done, value } = await reader.read()
								if( done ) break
								res.write(value)
							}
						}
						
						res.end()
					}
					catch( error ) {
						next(error)
					}
				})
				
			})
			// --- 4. PRODUCTION DICTIONARY EMISSION PASS ---
			api.onAfterBuild(async () => {
				const prodDistPath = resolve(api.context.distPath)
				const serverOutputFile = resolve(prodDistPath, "index.mjs")
				
				// Scan and pull EVERY single produced client asset file inside dist
				//const assetsGlob = glob("**/*", { cwd: prodDistPath })
				const assetsGlob = new Bun.Glob("**/*")
				
				const scannedAssets = assetsGlob.scan({ cwd: prodDistPath })
				
				const assetPayloadDictionary = new MagicString("{\n")
				
				let rootHtmlBase64 = new MagicString("").toString()
				
				for await ( const assetFile of scannedAssets ) {
					// Ignore the output server destination name to avoid recursive readings
					if( assetFile === "index.mjs" ) {
						continue
					}
					
					const absoluteAssetPath = resolve(prodDistPath, assetFile)
					/**
					 * NOTE:
					 *
					 * Bun.file(absoluteAssetPath).text()
					 * does not work because Bun.file().text() returns a standard JavaScript primitive string, not a Node.js Buffer object.
					 *
					 * Primitive JavaScript strings do not have a .toString("base64") method.
					 * When you call it, JavaScript either throws a TypeError or ignores the "base64"
					 * argument and just returns the original text.
					 */
					const rawBuffer = await readFile(absoluteAssetPath)
					
					const base64String = rawBuffer.toString("base64")
					const normalizedPath = `/${ assetFile.replace(/\\/g, "/") }`
					
					if( assetFile === "index.html" ) {
						rootHtmlBase64 = base64String
					}
					
					assetPayloadDictionary.append(`"${ normalizedPath }": "${ base64String }",\n`)
				}
				assetPayloadDictionary.append("}")
				
				// Transpile and copy the API files into the dist folder
				//const distFilesGlob = await glob(`**/*.{ts,js}`, { cwd: options.apiDirectory })
				const distFilesGlob = new Bun.Glob("**/*.{ts,js}").scan({ cwd: options.apiDirectory })
				
				// Placeholder for injected production Hono routes
				const productionImports = new MagicString("")
				
				const productionRoutes = new MagicString("")
				
				const transpiler = new Bun.Transpiler({ loader: "ts", allowBunRuntime: true })
				
				for await ( const f of distFilesGlob ) {
					//const rawCodeText = await readFile(resolve(options.apiDirectory, f), "utf-8")
					const rawCodeText = await Bun.file(resolve(options.apiDirectory, f)).text()
					
					const transpiledResult = await transpiler.transform(rawCodeText)
					
					const cleanFilePath = f.replace(/\\/g, "/").replace(/\.ts$/, ".js")
					
					const outputTargetFile = resolve(prodDistPath, "api-source", cleanFilePath)
					
					await mkdir(dirname(outputTargetFile), { recursive: true })
					
					//await writeFile(outputTargetFile, transpiledResult)
					await Bun.write(outputTargetFile, transpiledResult)
					let routeUrlPath = f.slice(0, -extname(f).length).replace(/\\/g, "/")
					
					routeUrlPath = routeUrlPath.replace(/\[([^\]]+)\]/g, ":$1")
					
					const cleanRoute = routeUrlPath === "index" ? "/" : `/${ routeUrlPath }`
					
					const randomID = Bun.hash(f).toString(36).slice(0, 8)
					
					productionRoutes.append(`import * as m_${ randomID } from "./api-source/${ cleanFilePath }"\n`)
					                .append(`if (m_${ randomID } && typeof m_${ randomID }.default.fetch === "function") {\n`)
					                .append(`\tapp.route("${ cleanRoute }", m_${ randomID }.default)\n}\n\n`)
				}
				
				// Assemble the final server module string containing the full asset lookup map
				const finalServerCode = new MagicString(`
import { Hono } from "hono"

export const app = new Hono().basePath("/api")

${ productionImports }

${ productionRoutes }
// Statically compiled Base64 binary asset map mapping paths to code bodies
const staticAssets = ${ assetPayloadDictionary }

const DEFAULT_HTML_BASE64 = "${ rootHtmlBase64 }"

// Automated MIME Type lookup utility
const getMimeType = (pathname) => {
	if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8"
    if (pathname.endsWith(".css")) return "text/css; charset=utf-8"
    if (pathname.endsWith(".html")) return "text/html; charset=utf-8"
    if (pathname.endsWith(".png")) return "image/png"
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg"
    if (pathname.endsWith(".svg")) return "image/svg+xml"
    if (pathname.endsWith(".ico")) return "image/x-icon"
	return "application/octet-stream"
}

// Convert Base64 strings to Uint8Array safely for V8 isolate environments without Node.js Buffer
const base64ToUint8 = (base64) => {
	return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

// Production entry point
const serverEngine = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Route API requests directly to Hono (passing env and ctx for cloudflare bindings)
    if (url.pathname.startsWith("/api")) {
      return app.fetch(request, env, ctx)
    }

    // Serve ANY asset dynamically from Base64 dictionary map with the correct content type
    if (staticAssets[url.pathname] !== undefined) {
      return new Response(base64ToUint8(staticAssets[url.pathname]), {
        headers: { "Content-Type": getMimeType(url.pathname) }
      })
    }

    // Fall back to index.html for frontend root routing navigation
    return new Response(base64ToUint8(DEFAULT_HTML_BASE64), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    })
  }
}
export default serverEngine
`).toString()
				
				await Bun.write(serverOutputFile, finalServerCode)
				console.info(`\nBuild generated at: ${ prodDistPath }\n`)
				
			})
		},
	}
}
