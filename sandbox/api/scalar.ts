import { Hono } from "hono"
import { Scalar } from "@scalar/hono-api-reference"

const app = new Hono()

// Use the middleware to serve the Scalar API Reference at /scalar
app.get("/", Scalar({ url: "/scalar" }))

export default app