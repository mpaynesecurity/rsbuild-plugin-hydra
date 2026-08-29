import type { RsbuildConfig, RsbuildPlugin } from "@rsbuild/core"
import { Context } from "hono"
import MagicString from "magic-string"
import { existsSync } from "node:fs"
import { mkdir, readFile } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"

interface IHydraOptions {
	/**
	 * Path to Hono api routes folder
	 * @example
	 * ```ts
	 * project-root/
	 *    src/
	 *      api/
	 *        route01.ts
	 *        route02.ts
	 *
	 * // Inside the rsbuild.config file
	 * hydra({
	 *      apiDirectory: "src/api",
	 * })
	 * ```
	 */
	apiDirectory: string
	
	/**
	 * Where the file containing the Hono routes will be placed
	 * @example
	 * ```ts
	 * hydra({
	 *   apiDirectory: "src/api",
	 *   routesFile: "src/routes.gen.ts"
	 * })
	 * ```
	 * */
	routesFile: string
}

const normalizePath = (filePath: string): string => {
	if(!filePath) {
		return ""
	}
	
	// Force all backslashes into forward slashes for URL compliance
	let cleanPath = filePath.replace(/\\/g, "/")
	
	// Strip any leading relative indicators (./ or /) if they exist
	if(cleanPath.startsWith("./")) {
		cleanPath = cleanPath.slice(2)
	}
	else if(cleanPath.startsWith("/")) {
		cleanPath = cleanPath.slice(1)
	}
	
	return cleanPath
}

/**
 *
 * @param {IHydraOptions} options
 * @returns {RsbuildPlugin}
 */
export const hydra = (options: IHydraOptions): RsbuildPlugin => {
	let isRouterFileWriting = false
	
	// --- 1. Generate Routes File ---
	const buildRoutesFile = async () => {
		if(isRouterFileWriting) {
			return
		}
		isRouterFileWriting = true
		
		try {
			const apiGlobber = new Bun.Glob("**/*.{ts,js}")
			const apiFiles = apiGlobber.scan({cwd: options.apiDirectory})
			
			const codeLines = new MagicString("").append(`import { Hono } from "hono"\nexport const app = new Hono().basePath("/api")\n`)
			
			for await (const f of apiFiles) {
				const randomApiFileId = Bun.hash(f).toString(36).slice(0, 8)
				const importNamespace = `route_${randomApiFileId}`
				
				const absoluteTarget = resolve(options.apiDirectory, f)
				
				// Calculate relative path from the ROUTE FILE'S DIRECTORY, not the file itself
				const routesFileDir = dirname(options.routesFile)
				let relativePath = relative(routesFileDir, absoluteTarget).replace(/\\/g, "/")
				
				if(!relativePath.startsWith(".")) {
					relativePath = `./${relativePath}`
				}
				
				const extName = extname(relativePath)
				if(extName) {
					relativePath = relativePath.slice(0, -extName.length)
				}
				
				// Remove the hardcoded ".ts" extension. Runtimes expect clean specifier modules.
				codeLines.append(`\nimport * as ${importNamespace} from "${relativePath}"\n`)
				
				let urlPath = f.slice(0, -extname(f).length).replace(/\\/g, "/")
				urlPath = urlPath.replace(/\[([^\]]+)\]/g, ":$1")
				const cleanRoute = urlPath === "index" ? "/" : `/${urlPath}`
				
				codeLines.append(`if (${importNamespace} && typeof ${importNamespace}.default.fetch === "function") {\n`)
				         .append(`\tapp.route("${cleanRoute}", ${importNamespace}.default)\n}\n`)
			}
			
			if(!existsSync(options.apiDirectory)) {
				await mkdir(options.apiDirectory, {recursive: true})
			}
			
			// Overwrite this file every build loop so new routes write out dynamically.
			await Bun.write(options.routesFile, codeLines.toString())
		}
		finally {
			isRouterFileWriting = false
		}
	}
	
	return {
		name: "rsbuild-plugin-hydra",
		// Register the required compiler hooks
		async setup(api) {
			// Generate the routes file before the production build is started
			api.onBeforeBuild(async () => {
				await buildRoutesFile()
			})
			api.modifyRsbuildConfig((config, {mergeRsbuildConfig}) => {
				// Initialize the dev config object if it doesn't exist
				config.dev ||= {}
				
				// Enforce an array structure so we don't accidentally overwrite other watch files the user might have configured manually
				const existingWatchFiles = Array.isArray(config.dev.watchFiles)
				                           ? config.dev.watchFiles
				                           : config.dev.watchFiles
				                             ? [config.dev.watchFiles]
				                             : []
				
				const pluginConfig: RsbuildConfig = {
					dev: {
						watchFiles: [
							...existingWatchFiles,
							{
								type: "restart", // Forces a full native Node CLI process reboot
								paths: [`${resolve(options.apiDirectory)}/**/*`, options.routesFile],
							},
						],
					},
				}
				return mergeRsbuildConfig(config, pluginConfig)
			})
			
			// --- 2.3 DEVELOPMENT ---
			api.onBeforeStartDevServer(async ({server}) => {
				// Generate the routes file before the dev server is started
				await buildRoutesFile()
				/**
				 * This middleware replaces `@hono/nodeserver` by converting Rsbuild/Node's Connect style middleware calls to web native apis.
				 * Reduced overall plugin bundle size by ~50%
				 * */
				server.middlewares.use(async (req, res, next) => {
					const protocol = req.headers["x-forwarded-proto"] || "http" || "ws"
					const host = req.headers.host || "localhost"
					
					const rawUrl = req.originalUrl || req.url || ""
					const parsedUrlContext = new URL(rawUrl, `${protocol}://${host}`)
					
					// 1. Fast path exit for standard static asset traffic
					if(!parsedUrlContext.pathname.startsWith("/api")) {
						return next()
					}
					
					try {
						const fileUrl = Bun.pathToFileURL(options.routesFile).href
						
						const cacheBustUrl = `${fileUrl}?update=${Date.now()}`
						const importedModule = await import(cacheBustUrl)
						
						const appInstance = importedModule?.app || importedModule?.default
						
						if(!appInstance || typeof appInstance.fetch !== "function") {
							console.warn(`[Hydra] Could not resolve a valid Hono instance from ${options.routesFile}`)
							return next()
						}
						
						if(typeof appInstance.notFound === "function") {
							appInstance.notFound((c: Context) => c.json({error: "Hono Dev 404: Route not matched", path: c.req.path}, 404))
						}
						
						// 2. Convert incoming Node stream headers into a Web standard Headers object
						const webHeaders = new Headers()
						for(const [key, value] of Object.entries(req.headers)) {
							if(value === undefined) continue
							if(Array.isArray(value)) {
								value.forEach(v => webHeaders.append(key, v))
							}
							else {
								webHeaders.set(key, value)
							}
						}
						// Check if the HTTP method allows a request body (GET/HEAD will throw if body is present)
						const hasBody = !["GET", "HEAD"].includes(req.method || "")
						
						// Build ReadableStream directly from the Node request iterator
						const webBody = hasBody
						                ? new ReadableStream({
								async start(controller) {
									for await (const chunk of req) {
										controller.enqueue(new Uint8Array(chunk))
									}
									controller.close()
								},
							}) : undefined
						
						// 3. Construct a standard Web API Request object out of the incoming Node metadata
						const webRequest = new Request(parsedUrlContext.href, {
							method: req.method,
							headers: webHeaders,
							// Cast through any to satisfy TypeScript's strict BodyInit constraints
							body: hasBody ? webBody : undefined,
						})
						
						// 4. Fire the request directly into Hono's agnostic fetch pipeline
						const webResponse: Response = await appInstance.fetch(webRequest)
						
						// 5. Pipe the standard Web Response properties back into the outgoing Node network socket
						res.statusCode = webResponse.status
						
						webResponse.headers.forEach((value, key) => {
							res.setHeader(key, value)
						})
						
						// 6. Stream the body chunks back out to the browser
						if(webResponse.body) {
							const reader = webResponse.body.getReader()
							while(true) {
								const {done, value} = await reader.read()
								if(done) break
								res.write(value)
							}
						}
						res.end()
					}
					catch(error) {
						next(error)
					}
				})
			})
			/**
			 * This hook is called after the production build has finished (css, js and other assets).
			 * We can utilize it for gathering the various binary assets/api routes and creating the production build
			 * */
			api.onAfterBuild(async () => {
				const prodDistPath = api.context.distPath
				
				// Construct path to final server build
				const serverOutputFile = resolve(prodDistPath, "index.mjs")
				
				// Gather all raw binary assets into array structure
				const assetsGlob = new Bun.Glob("**/*.*").scan({cwd: prodDistPath})
				
				// Empty container for the production css and js
				const assetEntries: string[] = []
				
				let rootHtmlBase64 = ""
				
				for await (const assetFile of assetsGlob) {
					if(assetFile === "index.mjs") {
						continue
					}
					
					// Construct the absolute path to the assets directory and files
					const absoluteAssetPath = resolve(prodDistPath, assetFile)
					
					if(!existsSync(absoluteAssetPath)) {
						console.error("Asset missing path lookup")
						process.exit(1)
					}
					
					/**
					 * @privateRemarks
					 * Bun.file does not return a NonSharedBuffer, so it cannot be used for
					 * reading the absolute assets path.
					 * */
					const rawBuffer = await readFile(absoluteAssetPath)
					const base64String = rawBuffer.toString("base64")
					
					const normalizedPath = `/${normalizePath(assetFile)}`
					
					if(assetFile === "index.html") {
						rootHtmlBase64 = base64String
						continue
					}
					
					assetEntries.push(`\t"${normalizedPath}": "${base64String}"`)
				}
				
				const assetsStr = `{\n${assetEntries.join(",\n")}\n}`
				
				const distFilesGlob = new Bun.Glob("**/*.{ts,js}").scan({cwd: options.apiDirectory})
				
				const transpiler = new Bun.Transpiler({loader: "ts", allowBunRuntime: true})
				
				// Container for Hono imports
				const msProductionImports = new MagicString("")
				
				// Container for imported api routes
				const msProductionRoutes = new MagicString("")
				
				// Container for normalized file paths
				const msNormalizedFilePaths = new MagicString("")
				
				for await (const f of distFilesGlob) {
					// Read in each file in `distFilesGlob`
					const apiRoutes = await Bun.file(resolve(options.apiDirectory, f)).text()
					
					// Use Bun's native transpiler to convert `.ts` to `.js`
					const transpiledApiRoutes = await transpiler.transform(apiRoutes)
					
					// Normalized each file's path
					const normalizedFilePath = normalizePath(f)
					
					// Append the normalized file paths to the `msNormalizedFilePaths` container
					msNormalizedFilePaths.append(normalizedFilePath)
					
					// Normalize the file path of each file in the glob and replace `.ts` with `.js`
					const cleanFilePath = normalizePath(f).replace(/\.ts$/, ".js")
					
					// Contruct the production output directory `dist/api-source/[filename].js`
					const outputTargetFile = resolve(prodDistPath, "api-source", cleanFilePath)
					
					// Create the output directory
					await mkdir(dirname(outputTargetFile), {recursive: true})
					
					// Write the compiled api routes to the `api-source` directory
					await Bun.write(outputTargetFile, transpiledApiRoutes)
					
					// Create a slice of the file name starting from the 0 index
					const routeUrlPath = normalizePath(f.slice(0, -extname(f).length)).replace(/\[([^\]]+)\]/g, ":$1")
					
					const cleanRoute = routeUrlPath === "index" ? "/" : `/${routeUrlPath}`
					
					// Randomly generated id to append to each imported api route
					const randomID = Bun.hash(f).toString(36).slice(0, 8)
					
					// Append the Hono imports to the `msProductionImports` container
					msProductionImports.append(`\nimport * as m_${randomID} from "./api-source/${cleanFilePath}"\n`)
					
					// Append the api routes to the `msProductionRoutes` container
					msProductionRoutes.append(`if (m_${randomID} && typeof m_${randomID}.default.fetch === "function") {\n`)
					                  .append(`\tapp.route("${cleanRoute}", m_${randomID}.default)\n}\n\n`)
				}
				
				// Construct the path to the primary template file
				const serverEngineTemplateFile = resolve(import.meta.dirname, "serverEngine.js")
				
				if(!existsSync(serverEngineTemplateFile)) {
					console.error("Server Engine template file not found")
					process.exit(1)
				}
				
				// Read in the template file
				const serverEngineTemplateFileContext = await Bun.file(serverEngineTemplateFile).text()
				
				// Find and replace template placeholders in serverEngine.ts/js
				const finalServerCode = serverEngineTemplateFileContext
					// Replace the production routes placeholder with the acctual Hono imports
					.replace(`/*!productionImports*/`, msProductionImports.toString())
					// Replace the production routes placeholder with the acctual api routes
					.replace(`/*!productionRoutes*/`, msProductionRoutes.toString())
					// Replace the assets placeholder with the acctual assets
					.replace(`"//!assetPayloadDictionary"`, assetsStr)
					// Replace the `index.html` placeholder with the acctual file
					.replace(`//!rootHtmlBase64`, rootHtmlBase64)
				
				// Generate the final build
				await Bun.write(serverOutputFile, finalServerCode)
				
				console.info(`\nBuild generated at: ${prodDistPath}\n`)
			})
		},
	}
}
