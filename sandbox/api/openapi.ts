import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"

const app = new Hono()

app.get(
	"/",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Hono API",
				version: "1.0.0",
				description: "Testing",
			},
			servers: [
				{ url: "http://localhost:3001", description: "Local Server" },
			],
		},
	}),
)
export default app