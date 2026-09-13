# Introduction

Rsbuild-plugin-hydra (Hydra for short) is a plugin which turns any Rsbuild app into a lightweight fullstack framework.

![NPM License](https://img.shields.io/npm/l/%40mpaynesecurity%2Frsbuild-plugin-hydra)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/%40mpaynesecurity%2Frsbuild-plugin-hydra)
![NPM Downloads](https://img.shields.io/npm/dm/%40mpaynesecurity%2Frsbuild-plugin-hydra)
![GitHub Sponsors](https://img.shields.io/github/sponsors/mpaynesecurity)

![https://ko-fi.com/s/c4e4fa35f8](https://img.shields.io/badge/Ko--fi-F16061?logo=ko-fi&logoColor=white&style=for-the-badge)

## What's in the name?

The Hydra originated from Greek mythology as a multi-headed serpent-like creature. Much like it's namesake,
Rsbuild-plugin-hydra has multiple heads, each one representing a Hono API route.

### The Hydra's Heads

1) **Integrated backend:** No more managing separate front and back ends.
2) **Simplified DX:** Place a standard Hono route in an `api` folder anywhere in your project and it will be
   automatically registered.
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
        apiDirectory: "sandbox/api",
        routesFile: "sandbox/api-routes.gen.ts",
    }),
  ]
})
```

## Development

### Add an API Route

```ts
import { Hono } from "hono"

const app = new Hono().get("/", (c) => {
    return c.json({message: "IT WORKED"})
})

export default app
```

### Run the dev server

#### NOTE: HMR does not work properly due to a known bug between older versions of Bun (=< 1.4.0) and the Rsbuild HMR websocket.

```bash
bun --bun rsbuild dev
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
- Production testing was achieved on Cloudflare via Wrangler (I am not in a financial position to use multiple cloud providers),
- I work a very demanding day job which requires frequent travel. PRs and bug foxes are welcome, but they may not be
  addressed right away.

## Thank You To

- The [Rsbuild/Rspack](https://rsbuild.rs) team for producing such versatile, cohesive and powerful tools.
- 
