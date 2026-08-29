import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { object, optional, string } from "zod"

const querySchema = object({
	name: optional(string()),
})

const app = new Hono().get(
	"/",
	zValidator("query", querySchema), (c) => {
		const query = c.req.valid("query")
		return c.text(`Hello ${query?.name ?? "Hono"}!`)
	},
)

export default app