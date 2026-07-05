import { Hono } from "hono"
export const app = new Hono().basePath("/api")

import * as rawModule_0 from "./api/test"
const untypedInstance_0: any = rawModule_0
const subApp_0 = untypedInstance_0.default || untypedInstance_0.app || untypedInstance_0
if (subApp_0 && typeof subApp_0.fetch === "function") {
  app.route('/test', subApp_0)
}

import * as rawModule_1 from "./api/users/:id"
const untypedInstance_1: any = rawModule_1
const subApp_1 = untypedInstance_1.default || untypedInstance_1.app || untypedInstance_1
if (subApp_1 && typeof subApp_1.fetch === "function") {
  app.route('/users/:id', subApp_1)
}
