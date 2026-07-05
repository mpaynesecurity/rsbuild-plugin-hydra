// api/users/:id.ts
import { Hono } from "hono"

const app = new Hono()

app.get("/", (c) => {
	const userId = c.req.param("id") // Resolves natively via Hono
	return c.json({ user: userId })
})

export default app