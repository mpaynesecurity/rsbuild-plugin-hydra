import { Hono } from "hono"
export const app = new Hono().basePath("/api")

import * as route_1ios4buj from "./api/context"
if (route_1ios4buj && typeof route_1ios4buj.default.fetch === "function") {
	app.route("/context", route_1ios4buj.default)
}

import * as route_19hf806d from "./api/os-info"
if (route_19hf806d && typeof route_19hf806d.default.fetch === "function") {
	app.route("/os-info", route_19hf806d.default)
}

import * as route_1aphofcx from "./api/say-hello"
if (route_1aphofcx && typeof route_1aphofcx.default.fetch === "function") {
	app.route("/say-hello", route_1aphofcx.default)
}

import * as route_d3nupttr from "./api/users/:id"
if (route_d3nupttr && typeof route_d3nupttr.default.fetch === "function") {
	app.route("/users/:id", route_d3nupttr.default)
}
