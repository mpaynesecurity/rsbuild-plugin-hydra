# Introduction

Rsbuild-plugin-hydra (Hydra for short) is a plugin which turns any Rsbuild app into a fullstack framework.

## What's in the name?

The Hydra originated from Greek mythology as a multi-headed serpent-like creature. Much like it's namesake,
Rsbuild-plugin-hydra has multiple heads, each one representing a Hono API route.

### The Hydra's Heads

1) **Integrated backend:** No more managing separate front and back ends.
2) **Simplified DX:** Place a standard Hono route in the `api` folder and it will automatically registered.
3) **UI Agnostic:** Works with any front-end framework supported by Rsbuild.
4) **Cloud-agnostic:** Runs on any cloud provider which supports the browser native `fetch` as its default export.

## Install the plugin

```bash
bun add @mpaynesecurity/rsbuild-plugin-hydra
```

## Add it to the plugins array

```ts
import { defineConfig } from "@rsbuild/core"
import { hydra } from "@mpaynesecurity/hydra"

export default defineConfig({
	plugins: [
		hydra({
			apiDirectory: "/path/to/api-directory",
			generatedRoutesFile: "/path/to/folder/filename.ts",
		})
	]
})
```

## Development

### Add an API Route

```ts
//src/api/test.ts
import { Hono } from "hono"

const app = new Hono()

app.get("/", (c) => {
	return c.json({ message: "IT WORKED" })
})
export default app
```

### Run the server

#### NOTE: HMR does not work properly due to a known bug between Bun and the Rsbuild HMR websocket.

```bash
# HMR will not work
bun --bun rsbuild
```

#### There are two workarounds

#### 1. Use the standard Node runtime instead.

```bash
rsbuild
```

#### 2. Upgrade Bun to the `canary` version

```bash
bun upgrade --canary
```

then run

```bash
bun --bun rsbuild
```

## Production build

Build the app for production:

```bash
bun --bun rsbuild build
```

## Preview using Bun runtime

Preview the production build using the Bun runtime:

```bash
bun dist/index.mjs
```

## Preview using Cloudflare Wrangler

Preview the production build in a simulated Cloudflare Workers environment:

```bash
wrangler dev
```

## Caveats

- Hydra is ESM only
- As I am not in a financial position to have multiple providers, Hydra has only been production tested on Cloudflare
  via Wrangler

