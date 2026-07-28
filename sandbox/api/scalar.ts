import { Scalar } from "@scalar/hono-api-reference"
import { Hono } from "hono"
import { env } from "../../validate-env"

const app = new Hono().get("/", Scalar({
	url: `http://localhost:${ env.data.PORT }/api/openapi`,
	customCss: `
	  html, body {
        overflow: hidden !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
	`,
	defaultHttpClient: {
		targetKey: "node",
		clientKey: "fetch",
	},
	theme: "kepler",
	layout: "modern",
}))

export default app