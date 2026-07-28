import { defineConfig } from "@rsbuild/core"
import { pluginBabel } from "@rsbuild/plugin-babel"
import { pluginSolid } from "@rsbuild/plugin-solid"
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss"
import { hydra } from "@mpaynesecurity/rsbuild-plugin-hydra"
import { env } from "./validate-env"


// Docs: https://rsbuild.rs/config/
export default defineConfig({
	plugins: [
		pluginBabel({
			include: /\.(?:jsx|tsx)$/,
		}),
		pluginSolid(),
		pluginTailwindcss(),
		hydra({
			apiDirectory: "sandbox/api",
			generatedRoutesFile: "sandbox/api-routes.gen.ts",
			completedBuildFileName: "index.mjs",
			contextFile: "context.ts",
		}),
	],
	output: {
		minify: true,
	},
	tools: {
		htmlPlugin: {
			title: "Plugin Sandbox",
		},
		lightningcssLoader: {
			minify: true,
		},
	},
	source: {
		entry: {
			index: "./sandbox/index.tsx",
		},
	},
	server: {
		port: env.data.PORT,
		publicDir: false,
	},
})
