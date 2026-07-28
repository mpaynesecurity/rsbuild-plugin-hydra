import { Scalar } from "@scalar/hono-api-reference"
import { Hono } from "hono"
import { env } from "../../validate-env"

const app = new Hono().get("/", Scalar({
	url: `http://localhost:${ env.data.PORT }/api/openapi`,
	defaultHttpClient: {
		targetKey: "node",
		clientKey: "fetch",
	},
	theme: "kepler",
	layout: "modern",
}))

export default app