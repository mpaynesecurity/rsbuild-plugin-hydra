import { createApiReference } from "@scalar/api-reference"
import "@scalar/api-reference/style.css"
import { onMount } from "solid-js"
import { openApiSpec } from "../api/openapi-spec.ts"

let containerRef

onMount(() => {
	if( !containerRef ) {
		return
	}
	createApiReference(containerRef, openApiSpec as any)
})


export default () => {
	return (
		<div ref={ containerRef } class="w-full h-screen overflow-y-auto" />
	)
}