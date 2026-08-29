import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { string, object, optional } from "zod"
import type { Ctx } from "../context"

const querySchema = object({
	message: optional(string()),
})


const app = new Hono<Ctx>().get(
	"/",
	zValidator("query", querySchema), (c) => {
		const query = c.req.valid("query")
		
		return c.json({
			message: `${query?.message}`,
		})
	},
)

export default app