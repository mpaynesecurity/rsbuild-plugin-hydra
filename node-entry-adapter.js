import { createServer } from "@hono/node-server"
// Import your freshly compiled, bulletproof Cloudflare/Universal bundle
import workerBundle from "./dist/index.mjs"

const PORT = process.env.PORT || 3001

// The adapter listens on a Node port, and maps all incoming traffic directly
// into your worker's default fetch() method
createServer( {
	              fetch: (request) => workerBundle.fetch( request ), port: PORT
              } )

console.log( `Server running on http://localhost:${PORT}` )
