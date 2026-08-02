import { z } from "zod"

/**
 * Validates system environment variables against a dynamic runtime schema
 * @param schema A Zod validation schema object
 * @returns Fully parsed and typed environment properties
 */
export const validateEnv = <SchemaShape extends z.ZodRawShape>(
	schema: z.ZodObject<SchemaShape>,
): z.infer<z.ZodObject<SchemaShape>> => {
	// Gracefully fall back to global contexts across Node, Bun, Vite, or Next.js
	const rawEnv = typeof process !== "undefined" && process.env
	               ? process.env
	               : (import.meta as any).env ?? {}
	
	// Executes parsing instantly; crashes the runtime if constraints fail
	return schema.parse(rawEnv)
}