# Introduction

Rsbuild-plugin-hydra (Hydra for short) is a plugin which turns any Rsbuild app into a fullstack framework.

## What's in the name?

The Hydra originated from Greek mythology as a multi-headed serpent-like creature. Much like it's namesake,
Rsbuild-plugin-hydra has multiple heads, each one representing a Hono route.
Thankfully, the plugin does not share its namesake's poisonous breath and blood.

## The Hydra's Heads

1) **Integrated backend**. No more managing separate front and back ends.
2) **Minimize vendor lock in**. Hydra can be used with any front-end framework supported by Rsbuild.
3) **Cloud-agnostic** Runs on any cloud provider which supports the browser native `fetch` as its default export.

:::warning
Hydra has only been tested via Cloudflare Wranger/miniflare as I am not in a financial position to test on multiple
providers. However, since Cloudflare has the most restrictive runtime environment, Hydra ***should*** work on other
providers as well.
:::