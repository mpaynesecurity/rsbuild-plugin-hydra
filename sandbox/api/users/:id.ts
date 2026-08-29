import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"

const employeeSchema = z.object({
	id: z.string().or(z.number()),
	name: z.string().optional(),
	email: z.email().optional(),
})

const app = new Hono().get(
	"/",
	zValidator("param", employeeSchema), (c) => {
		const {id, name, email} = c.req.valid("param")
		return c.json({
			id,
			name,
			email,
		})
	},
)

export default app