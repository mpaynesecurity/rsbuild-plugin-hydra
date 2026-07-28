import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import { string, object, optional } from "valibot"
import type { Ctx } from "../context.ts"

const querySchema = object({
	message: optional(string()),
})

const responseSchema = string()

const app = new Hono<Ctx>().get(
	"/",
	describeRoute({
		description: "Get the data in context storage",
		responses: {
			200: {
				description: "Successful response",
				content: {
					"text/plain": {
						schema: resolver(responseSchema),
					},
				},
			},
		},
	}),
	validator("query", querySchema), (c) => {
		const query = c.req.valid("query")
		
		return c.json({
			message: `${ query?.message }`,
		})
	},
)

export default app