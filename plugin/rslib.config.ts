import { defineConfig } from "@rslib/core"
import pkg from "./package.json" with { type: "json" }

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
		legalComments: "inline", // Inlines legal notices; stops *.LICENSE.txt sidecars
		// Overrides Rslib's internal flattening to force files to honor their entry keys
		filename: {
			js: "[name].js",
		},
		cleanDistPath: true,
		target: "node",
		module: true,
		
		//externals: [
		//	/^[^./\\]+/, // Matches bare specifiers like 'typescript', 'lodash', etc.
		//	/^@/,         // Matches scoped packages like '@nestjs/core'
		//],
		externals: [ "typescript", "rslib",
			...Object.keys(pkg.devDependencies || {}),
			...Object.keys(pkg.peerDependencies || {}),
		],
	},
	source: {
		// Creates a directory for each export
		entry: {
			"node-server/index": "./node-server/index.ts",
			"universal-server/index": "./universal-server/index.ts",
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
