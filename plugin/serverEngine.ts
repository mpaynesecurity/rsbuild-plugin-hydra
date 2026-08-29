import { Hono, type ExecutionContext, type Env } from "hono"

export const app: Hono = new Hono().basePath("/api")

/*!productionImports*/

/*!productionRoutes*/

// Statically compiled Base64 binary asset map mapping paths to code bodies
const staticAssets = "//!assetPayloadDictionary"

const DEFAULT_HTML_BASE64 = "//!rootHtmlBase64"

/**
 * Automated MIME Type lookup utility
 * @param {string} pathname
 * @returns {string}
 */
const getMimeType = (pathname: string): string => {
	if(pathname.endsWith(".js")) {
		return "application/javascript; charset=utf-8"
	}
	if(pathname.endsWith(".css")) {
		return "text/css; charset=utf-8"
	}
	if(pathname.endsWith(".html")) {
		return "text/html; charset=utf-8"
	}
	if(pathname.endsWith(".png")) {
		return "image/png"
	}
	if(pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
		return "image/jpeg"
	}
	if(pathname.endsWith(".svg")) {
		return "image/svg+xml"
	}
	if(pathname.endsWith(".ico")) {
		return "image/x-icon"
	}
	return "application/octet-stream"
}

/**
 * Convert Base64 strings to Uint8Array for V8 isolate environments without access to a Node buffer
 * @param {string} base64
 * @returns {Uint8Array<ArrayBuffer>}
 */
const base64ToUint8 = (base64: string): Uint8Array<ArrayBuffer> => {
	return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

// Production entry point
const serverEngine = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext | undefined) {
		const url = new URL(request.url)
		
		// Route API requests directly to Hono (passing env and ctx for cloudflare bindings)
		if(url.pathname.startsWith("/api")) {
			return app.fetch(request, env, ctx)
		}
		
		// Serve ANY asset dynamically from Base64 dictionary map with the correct content type
		//@ts-ignore static assets will be dynamically injected
		if(staticAssets[url.pathname] !== undefined) {
			//@ts-ignore static assets will be dynamically injected
			return new Response(base64ToUint8(staticAssets[url.pathname]), {
				headers: {"Content-Type": getMimeType(url.pathname)},
			})
		}
		
		// Fall back to index.html for frontend root routing navigation
		return new Response(base64ToUint8(DEFAULT_HTML_BASE64), {
			headers: {"Content-Type": "text/html; charset=utf-8"},
		})
	},
}
export default serverEngine