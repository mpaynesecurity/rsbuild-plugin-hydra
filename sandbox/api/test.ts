import { Hono } from "hono"

const app = new Hono()

app.get("/", (c) => {
	return c.json({ message: "IT WORKED" })
})
export default app