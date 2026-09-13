import type { Ctx } from "@/context"
import { Context, Hono, type Next } from "hono"
import { createMiddleware } from "hono/factory"
import { validator } from "hono/validator"


const ctxMiddleware = createMiddleware<Ctx>(async (c: Context, next: Next) => {
	c.set("message", "hi")
	await next()
})

const app = new Hono()
	.get("/", ctxMiddleware, (c) => c.text(c.var.message))
	.post("/", validator("form", async (value, c) => {
		const msg = value["message"]
		if(!msg) {
			return c.text("Missing field", 404)
		}
		console.log(msg)
		return {msg}
	}))


export type AppType = typeof app
export default app