import { Hono } from "hono"
import { Scalar } from "@scalar/hono-api-reference"

const app = new Hono().get("/", Scalar({ url: "/scalar" }))

export default app