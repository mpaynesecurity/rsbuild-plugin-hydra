import { defineConfig } from "@rsbuild/core"
import { pluginBabel } from "@rsbuild/plugin-babel"
import { pluginSolid } from "@rsbuild/plugin-solid"
import { pluginTailwindcss } from "@rsbuild/plugin-tailwindcss"
import { hydra } from "@mpaynesecurity/rsbuild-plugin-hydra"




export default defineConfig({
	plugins: [
		pluginBabel({
			include: /\.(?:jsx|tsx)$/,
		}),
		pluginSolid(),
		pluginTailwindcss(),
		hydra({
			apiDirectory: "sandbox/api",
			routesFile: "sandbox/api-routes.gen.ts",
		}),
	],
	dev: {
		browserLogs: {
			stackTrace: "none",
		},
		lazyCompilation: true,
	},
	tools: {
		htmlPlugin: {
			title: "Plugin Sandbox",
		},
		lightningcssLoader: {
			minify: true,
		},
		swc: {
			module: {
				type: "nodenext",
			},
		},
		rspack: {
			watchOptions: {
				/*
				 Bun's native file watcher (FSWatcher) in canary can occasionally
				 exhibit memory growth when watching deep node_modules trees.
				 This explicitly restricts the watcher scope
				 */
				ignored: /node_modules/,
			},
		},
	},
	source: {
		entry: {
			index: "./sandbox/index.tsx",
		},
	},
	server: {
		port: parseInt(process.env.PORT!),
		publicDir: false,
	},
})
