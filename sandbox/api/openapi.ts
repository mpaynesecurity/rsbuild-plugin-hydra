import { Hono } from "hono"
import type { OpenAPIV3 } from "openapi-types"

const openApiSpec = {
	openapi: "3.0.0",
	info: {
		title: "Hydra Sandbox API Reference",
		version: "1.0.0",
	},
	paths: {
		"/api/users": {
			get: {
				tags: [ "Users" ],
				summary: "Get all users",
				responses: { 200: { description: "Success" } },
			},
		},
	},
} satisfies OpenAPIV3.Document

const app = new Hono().get("/", (c) => {
	return c.json(openApiSpec)
})

export default app