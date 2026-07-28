import { Hono } from "hono"
import { openApiSpec } from "./openapi-spec.ts"


const app = new Hono().get("/", (c) => {
	return c.json(openApiSpec)
})

export default app