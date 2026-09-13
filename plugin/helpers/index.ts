import MagicString from "magic-string"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname, extname, relative, resolve } from "node:path"

/**
 * Normalize string paths for cross-platform compatability
 * @param {string} filePath
 * @returns {string}
 */
export const normalizePath = (filePath: string): string => {
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
 * Generates a random UUID using Bun's`hash()` function
 * @param {string} data
 * @returns {string}
 */
export const generateUUID = (data: string): string => {
	return Bun.hash(data).toString(36).slice(0, 8)
}


/**
 *
 * @param {string} apiDirectory
 * @param {string} routesFile
 * @returns {Promise<void>}
 */
export const buildRoutesFile = async (apiDirectory: string, routesFile: string): Promise<void> => {
	try {
		const apiGlob = new Bun.Glob("**/*.{ts,js}")
		const apiFiles = apiGlob.scan({cwd: apiDirectory})
		
		const codeLines = new MagicString("").append(`import { Hono } from "hono"\nexport const app = new Hono().basePath("/api")\n`)
		
		for await (const f of apiFiles) {
			const randomApiFileId = generateUUID(f)
			const importNamespace = `route_${randomApiFileId}`
			
			const absoluteTarget = resolve(apiDirectory, f)
			
			// Calculate relative path from the ROUTE FILE'S DIRECTORY, not the file itself
			const routesFileDir = dirname(routesFile)
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
		
		if(!existsSync(apiDirectory)) {
			await mkdir(apiDirectory, {recursive: true})
		}
		
		// Overwrite this file every build loop so new routes write out dynamically.
		await Bun.write(routesFile, codeLines.toString())
	}
	catch {
	}
}

