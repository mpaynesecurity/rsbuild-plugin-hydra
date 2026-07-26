import { getRequestListener } from "@hono/node-server"
import type { RsbuildPlugin } from "@rsbuild/core"
import { glob } from "fast-glob"
import MagicString from "magic-string"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { type TranspileOutput } from "typescript"

interface PluginOptions {
	/**
	 * Path where Hono api routes are stored
	 * @default src/api
	 */
	apiDirectory: string
	/**
	 * Where the auto-generated Hono routes file is places
	 * @default src/api-routes.gen.ts
	 */
	generatedRoutesFile?: string
	/**
	 * Location for the final build artifacts (css, js, etc)
	 * @default dist
	 */
	buildArtifactsOutputDirectory?: string
	/**
	 * Name of the entry point for the production build
	 * @default index.mjs
	 */
	completedBuildFileName?: string
}

export const hydra = (options: PluginOptions): RsbuildPlugin => {
	const apiDir = options.apiDirectory
	const generatedRoutesFile = options.generatedRoutesFile ?? "api.routes.ts"
	const buildArtifactsOutputDirectory = options.buildArtifactsOutputDirectory ?? "dist"
	const resolvedOutputPath = resolve(generatedRoutesFile)
	
	let isRouterFileWriting = false
	
	// --- 1. DEV ROUTER FILE GENERATION ---
	const buildPhysicalRouterFile = async () => {
		if( isRouterFileWriting ) return
		isRouterFileWriting = true
		
		try {
			const files = await glob(`**/*.{ts,js}`, { cwd: resolve(apiDir) })
			
			const outputDir = dirname(resolvedOutputPath)
			
			const codeLines = new MagicString("")
				.append(`import { Hono } from "hono"\n`)
				.append(`export const app = new Hono().basePath("/api")\n`)
			
			files.forEach((file, index) => {
				const namespaceName = `rawModule_${ index }`
				const absoluteTarget = resolve(apiDir, file)
				let relativePath = relative(outputDir, absoluteTarget).replace(/\\/g, "/")
				
				if( !relativePath.startsWith(".") ) {
					relativePath = `./${ relativePath }`
				}
				
				const extName = extname(relativePath)
				if( extName ) {
					relativePath = relativePath.slice(0, -extName.length)
				}
				
				// append the resolved namespace and relative path (file containing the Hono route
				codeLines.append(`\nimport * as ${ namespaceName } from "${ relativePath }"\n`)
				
				let urlPath = file.slice(0, -extname(file).length).replace(/\\/g, "/")
				urlPath = urlPath.replace(/\[([^\]]+)\]/g, ":$1")
				const cleanRoute = urlPath === "index" ? "/" : `/${ urlPath }`
				
				codeLines.append(`const untypedInstance_${ index }: any = ${ namespaceName }\n`)
				         .append(`const subApp_${ index } = untypedInstance_${ index }.default || untypedInstance_${ index }.app || untypedInstance_${ index }\n`)
				         .append(`if (subApp_${ index } && typeof subApp_${ index }.fetch === "function") {\n`)
				         .append(`\tapp.route('${ cleanRoute }', subApp_${ index })\n}\n`)
			})
			
			await mkdir(outputDir, { recursive: true })
			await writeFile(resolvedOutputPath, codeLines.toString())
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
						paths: [
							`${ resolve(options.apiDirectory) }/**/*`,
						],
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
					
					let rawUrl = req.originalUrl || req.url || ""
					const parsedUrlContext = new URL(rawUrl, `${ protocol }://${ host }`)
					
					if( !parsedUrlContext.pathname.startsWith("/api") ) {
						return next()
					}
					
					try {
						const fileUrl = pathToFileURL(resolvedOutputPath).href
						const cacheBustUrl = `${ fileUrl }?update=${ Date.now() }`
						const { app } = await import(cacheBustUrl)
						
						app.notFound((c: any) => c.json({ error: "Hono Dev 404: Route not matched", path: c.req.path }, 404))
						
						req.url = parsedUrlContext.pathname + parsedUrlContext.search
						
						const nativeNodeHandler = getRequestListener(app.fetch)
						await nativeNodeHandler(req, res)
					}
					catch( error ) {
						next(error)
					}
				})
			})
			
			// --- 4. PRODUCTION DICTIONARY EMISSION PASS ---
			api.onAfterBuild(async () => {
				const prodDistPath = resolve(api.context.distPath || buildArtifactsOutputDirectory)
				const serverOutputFile = resolve(prodDistPath, options.completedBuildFileName ?? "server.mjs")
				
				// Scan and pull EVERY single produced client asset file inside dist recursively
				const allClientAssets = await glob("**/*", { cwd: prodDistPath, onlyFiles: true })
				
				const assetPayloadDictionary = new MagicString("{\n")
				
				let rootHtmlBase64 = new MagicString("").toString()
				
				for( const assetFile of allClientAssets ) {
					// Ignore the output server destination name to avoid recursive readings
					if( assetFile === (options.completedBuildFileName ?? "index.mjs") ) {
						continue
					}
					
					const absoluteAssetPath = resolve(prodDistPath, assetFile)
					const rawBuffer = await readFile(absoluteAssetPath)
					const base64String = rawBuffer.toString("base64")
					const normalizedPath = `/${ assetFile.replace(/\\/g, "/") }`
					
					if( assetFile === "index.html" ) {
						rootHtmlBase64 = base64String
					}
					assetPayloadDictionary.append(`"${ normalizedPath }": "${ base64String }",\n`)
				}
				assetPayloadDictionary.append("}")
				
				// Transpile and copy the API files into the dist folder using typescript utilities
				const ts = await import("typescript")
				const files = await glob(`**/*.{ts,js}`, { cwd: apiDir })
				
				const productionImportsBlock = new MagicString("")
				const productionMountsBlock = new MagicString("")
				
				for( let i = 0; i < files.length; i++ ) {
					const file = files[i]
					const rawCodeText = await readFile(resolve(apiDir, file), "utf-8")
					
					const transpiledResult: TranspileOutput = ts.default.transpileModule(rawCodeText, {
						compilerOptions: {
							target: ts.default.ScriptTarget.ES2024,
							module: ts.default.ModuleKind.ESNext,
						},
					})
					
					const cleanFilePath = file.replace(/\\/g, "/").replace(/\.ts$/, ".js")
					
					const outputTargetFile = resolve(prodDistPath, "api-source", cleanFilePath)
					
					await mkdir(dirname(outputTargetFile), { recursive: true })
					
					await writeFile(outputTargetFile, transpiledResult.outputText)
					
					let routeUrlPath = file.slice(0, -extname(file).length).replace(/\\/g, "/")
					
					routeUrlPath = routeUrlPath.replace(/\[([^\]]+)\]/g, ":$1")
					
					const cleanRoute = routeUrlPath === "index" ? "/" : `/${ routeUrlPath }`
					
					productionMountsBlock.append(`import * as m${ i } from "./api-source/${ cleanFilePath }"\n`)
					                     .append(`const a${ i } = m${ i }?.app || m${ i }.default || m${ i }\n`)
					                     .append(`if (a${ i } && typeof a${ i }.fetch === "function") app.route('${ cleanRoute }', a${ i })\n\n`)
				}
				
				// Assemble the final server module string containing the full asset lookup map
				const finalServerCode = new MagicString(`
import { Hono } from "hono"

export const app = new Hono().basePath("/api")

${ productionImportsBlock }

${ productionMountsBlock }

// Statically compiled Base64 binary asset map mapping paths to code bodies
const hydraStaticAssets = ${ assetPayloadDictionary }
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
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Route API requests directly to Hono (passing env and ctx for cloudflare bindings)
    if (url.pathname.startsWith("/api")) {
      return app.fetch(request, env, ctx)
    }

    // Serve ANY asset dynamically from Base64 dictionary map with the correct content type
    if (hydraStaticAssets[url.pathname] !== undefined) {
      return new Response(base64ToUint8(hydraStaticAssets[url.pathname]), {
        headers: { "Content-Type": getMimeType(url.pathname) }
      })
    }

    // Fall back to index.html for frontend root routing navigation
    return new Response(base64ToUint8(DEFAULT_HTML_BASE64), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    })
  }
}
`).toString()
				
				await writeFile(serverOutputFile, finalServerCode)
				console.log(`\n${ options.completedBuildFileName ?? "index.mjs" } build generated at: ${ prodDistPath }\n`)
			})
		},
	}
}
