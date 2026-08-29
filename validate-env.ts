import { validateEnv } from "@mpaynesecurity/rsbuild-plugin-hydra/env"
import { object, coerce } from "zod"

// Testing
export const env = validateEnv(object({
	PORT: coerce.number({
		error: (issue) => {
			console.error(`${issue.message}`)
		},
	}),
}))