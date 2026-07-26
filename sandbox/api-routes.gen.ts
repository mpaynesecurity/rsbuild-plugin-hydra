import { Hono } from "hono"
export const app = new Hono().basePath("/api")

import * as rawModule_0 from "./api/openapi"
const untypedInstance_0: any = rawModule_0
const subApp_0 = untypedInstance_0.default || untypedInstance_0.app || untypedInstance_0
if (subApp_0 && typeof subApp_0.fetch === "function") {
	app.route('/openapi', subApp_0)
}

import * as rawModule_1 from "./api/os-info"
const untypedInstance_1: any = rawModule_1
const subApp_1 = untypedInstance_1.default || untypedInstance_1.app || untypedInstance_1
if (subApp_1 && typeof subApp_1.fetch === "function") {
	app.route('/os-info', subApp_1)
}

import * as rawModule_2 from "./api/scalar"
const untypedInstance_2: any = rawModule_2
const subApp_2 = untypedInstance_2.default || untypedInstance_2.app || untypedInstance_2
if (subApp_2 && typeof subApp_2.fetch === "function") {
	app.route('/scalar', subApp_2)
}

import * as rawModule_3 from "./api/users/:id"
const untypedInstance_3: any = rawModule_3
const subApp_3 = untypedInstance_3.default || untypedInstance_3.app || untypedInstance_3
if (subApp_3 && typeof subApp_3.fetch === "function") {
	app.route('/users/:id', subApp_3)
}
