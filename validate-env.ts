import { TypedEnv } from "@mpaynesecurity/rsbuild-plugin-hydra/env"
import { number, object, pipe, string, transform } from "valibot"

export const env = new TypedEnv(object({
	PORT: pipe(string(), transform((val) => parseInt(val, 10)), number()),
}))