import MagicString from "magic-string"
import type { RsbuildPlugin } from "@rsbuild/core"
import glob from "fast-glob"
import { resolve, dirname, relative, extname } from "node:path"
import { mkdir, writeFile, readFile } from "node:fs/promises"

interface PluginOptions {
	apiDirectory: string
	generatedRoutesFile?: string
	buildArtifactsOutputDirectory?: string
	completedBuildFileName?: string
}

export const hydra = (opts: PluginOptions): RsbuildPlugin => {
	const apiDir = resolve(opts.apiDirectory)
	const genFile = resolve(opts.generatedRoutesFile ?? "api-routes.gen.ts")
	const distDir = resolve(opts.buildArtifactsOutputDirectory ?? "dist")
	const serverName = opts.completedBuildFileName ?? "server.mjs"
	
	async function buildDevRouterFile() {
		const files = await glob(`**/*.{ts,js}`, { cwd: apiDir })
		const ms = new MagicString("import { Hono } from \"hono\"\nexport const app = new Hono().basePath(\"/api\")\n\n")
		
		files.forEach((file, index) => {
			let urlPath = file.slice(0, -extname(file).length).replace(/\\/g, "/")
			urlPath = urlPath.replace(/\[([^\]]+)\]/g, ":$1")
			const route = urlPath === "index" ? "/" : `/${ urlPath }`
			
			let relPath = relative(dirname(genFile), resolve(apiDir, file)).replace(/\\/g, "/").replace(/\.(ts|js)$/, "")
			if( !relPath.startsWith(".") ) relPath = `./${ relPath }`
			
			ms.append(`import * as m${ index } from "${ relPath }"\n`)
			ms.append(`const a${ index }: any = m${ index }["default"] || m${ index }["app"] || m${ index }\n`)
			ms.append(`if (a${ index }?.fetch) app.route('${ route }', a${ index })\n\n`)
		})
		
		await mkdir(dirname(genFile), { recursive: true })
		await writeFile(genFile, ms.toString())
	}
	
	return {
		name: "rsbuild-plugin-hydra",
		async setup(api) {
			api.onBeforeBuild(buildDevRouterFile)
			api.onBeforeStartDevServer(buildDevRouterFile)
			
			api.modifyRsbuildConfig((c) => {
				c.dev = { ...c.dev, watchFiles: [ { type: "reload-server", paths: [ apiDir ] } ] }
			})
			
			// --- SEPARATED SELF-CONTAINED PRODUCTION WRAPPER EMISSION ---
			// --- PRODUCTION STANDALONE WRAPPER EMISSION ---
			api.onAfterBuild(async () => {
				const prodDistPath = resolve(api.context.distPath || distDir)
				const serverOutputFile = resolve(prodDistPath, serverName)
				
				const html = await readFile(resolve(prodDistPath, "index.html"), "utf-8").catch(() => "")
				
				// 1. Scan and parse ALL compiled client assets inside the static directory
				const staticFiles = await glob("static/**/*", { cwd: prodDistPath })
				let assetPayloadRegistry = "{\n"
				
				for( const assetFile of staticFiles ) {
					const absoluteAssetPath = resolve(prodDistPath, assetFile)
					const rawAssetContent = await readFile(absoluteAssetPath, "utf-8").catch(() => "")
					
					// Safely escape backticks and templates for literal string values
					const safeAssetContent = rawAssetContent
						.replace(/\\/g, "\\\\")
						.replace(/`/g, "\\`")
						.replace(/\${/g, "\\${")
					
					assetPayloadRegistry += `  "/${ assetFile }": \`${ safeAssetContent }\`,\n`
				}
				assetPayloadRegistry += "}"
				
				const ts = await import("typescript")
				const files = await glob(`**/*.{ts,js}`, { cwd: apiDir })
				
				let productionImportsBlock = ""
				let productionMountsBlock = ""
				
				for( let i = 0; i < files.length; i++ ) {
					const file = files[i]
					const rawCode = await readFile(resolve(apiDir, file), "utf-8")
					
					const transpiledResult = ts.default.transpileModule(rawCode, {
						compilerOptions: {
							target: ts.default.ScriptTarget.ES2022,
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
					
					productionImportsBlock += `import * as m${ i } from "./api-source/${ cleanFilePath }"\n`
					productionMountsBlock += `const a${ i } = m${ i }["default"] || m${ i }["app"] || m${ i }\n`
					productionMountsBlock += `if (a${ i } && typeof a${ i }.fetch === "function") app.route('${ cleanRoute }', a${ i })\n\n`
				}
				
				// 2. Output the server wrapper code utilizing the asset dictionary lookup
				const finalServerCode = `
import { createServer } from "node:http"
import { getRequestListener } from "@hono/node-server"
import { Hono } from "hono"

export const app = new Hono().basePath("/api")

${ productionImportsBlock }

${ productionMountsBlock }

const honoNodeHandler = getRequestListener(app.fetch)

// Inlined asset dictionary map context
const hydraStaticAssets = ${ assetPayloadRegistry }

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "", "http://localhost")

  if (url.pathname.startsWith("/api")) {
    return honoNodeHandler(req, res)
  }

  // 3. FIX: Handle all static file payloads gracefully
  if (hydraStaticAssets[url.pathname] !== undefined) {
    const isCss = url.pathname.endsWith(".css")
    res.writeHead(200, { "Content-Type": isCss ? "text/css" : "application/javascript" })
    res.end(hydraStaticAssets[url.pathname])
    return
  }

  res.writeHead(200, { "Content-Type": "text/html" })
  res.end(\`${ html.replace(/`/g, "\\`").replace(/\${/g, "\\${") }\`)
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log("Application running on port http://localhost:" + PORT)
})
`.trim()
				
				await writeFile(serverOutputFile, finalServerCode)
				console.log(`\n✨ Standalone Hydra Monolith generated cleanly inside: ${ prodDistPath }\n`)
			})
			
		},
	}
}
