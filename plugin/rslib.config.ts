import { defineConfig } from "@rslib/core"
import * as pkg from "./package.json" with { type: "json" }

export default defineConfig({
	lib: [
		{
			format: "esm",
			syntax: "es2024",
			dts: {
				isolated: true,
			},
		},
	],
	output: {
		sourceMap: false,
		// Inlines legal notices; stops *.LICENSE.txt sidecars
		legalComments: "inline",
		// Overrides Rslib's internal flattening to force files to honor their entry keys
		filename: {
			js: "[name].js",
		},
		cleanDistPath: true,
		target: "node",
		module: true,
		minify: {
			jsOptions: {
				minimizerOptions: {
					// maintain function names
					mangle: false,
					minify: true,
				},
			},
		},
		autoExternal: true,
		// do not bundle dev dependencies
		externals: [ ...Object.keys(pkg.devDependencies) ],
	},
	source: {
		entry: {
			"index": "index.ts",
			"http/index": "./http/index.ts",
			"env/index": "./env/index.ts",
		},
	},
	tools: {
		rspack: {
			output: {
				asyncChunks: true,
			},
		},
	},
})
