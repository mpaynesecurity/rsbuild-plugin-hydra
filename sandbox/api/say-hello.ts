import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import * as v from "valibot"

const querySchema = v.object({
	name: v.optional(v.string()),
})

const responseSchema = v.string()

const app = new Hono().get(
	"/",
	describeRoute({
		description: "Say hello to the user",
		responses: {
			200: {
				description: "Successful response",
				content: {
					"text/plain": { schema: resolver(responseSchema) },
				},
			},
		},
	}),
	validator("query", querySchema), (c) => {
		const query = c.req.valid("query")
		return c.text(`Hello ${ query?.name ?? "Hono" }!`)
	},
)

export default app