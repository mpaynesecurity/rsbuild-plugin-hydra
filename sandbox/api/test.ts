import { Hono } from "hono"

const app = new Hono()

app.get("/", (c) => {
	return c.json({
		data: "IT WORKED",
	})
})

export default app