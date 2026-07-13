import { Hono } from "hono"

export const app = new Hono().basePath("/api")

import * as m0 from "./api/openapi"

const a0: any = m0["default"] || m0
if( a0?.fetch ) app.route("/openapi", a0)

import * as m1 from "./api/scalar"

const a1: any = m1["default"] || m1
if( a1?.fetch ) app.route("/scalar", a1)

import * as m2 from "./api/test"

const a2: any = m2["default"] || m2
if( a2?.fetch ) app.route("/test", a2)

import * as m3 from "./api/users/:id"

const a3: any = m3["default"] || m3
if( a3?.fetch ) app.route("/users/:id", a3)

