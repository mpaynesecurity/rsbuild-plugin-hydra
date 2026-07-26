import { type RouteDefinition, Router } from "@solidjs/router"
import { lazy } from "solid-js"
import { render } from "solid-js/web"
import "./styles.css"
import { NavbarLayout } from "@/layouts"

const routes = [
	{
		path: "/",
		component: lazy(() => import("./pages/index.tsx")),
	},
] satisfies RouteDefinition[]

const root = document.getElementById("root")
if( root ) {
	render(() => <Router root={ NavbarLayout }>{ routes }</Router>, root)
}
