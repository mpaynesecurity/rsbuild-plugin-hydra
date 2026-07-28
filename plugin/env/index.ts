import {
	type InferOutput,
	type ObjectEntries,
	type ObjectSchema,
	isValiError,
	parse,
} from "valibot"

/**
 *
 */
type GenericObjectSchema = ObjectSchema<ObjectEntries, undefined>

/**
 *
 */
export class TypedEnv<TSchema extends GenericObjectSchema> {
	// This automatically holds the inferred runtime structure of whatever schema is passed in
	public readonly data: InferOutput<TSchema>
	
	constructor(schema: TSchema) {
		try {
			this.data = parse(schema, process.env)
		}
		catch( error ) {
			if( isValiError(error) ) {
				console.error("❌ Missing or invalid environment configuration fields:")
				for( const issue of error.issues ) {
					const path = issue.path?.map((p) => p.key).join(".")
					console.error(`   - [${ path }]: ${ issue.message }`)
				}
			}
			process.exit(1)
		}
	}
}
