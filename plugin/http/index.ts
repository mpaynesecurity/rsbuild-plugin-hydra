import { ofetch, type $Fetch, type FetchOptions } from "ofetch"

/**
 * @interface IOptions
 * Options for useApiFetch helper
 */
export interface IOptions {
	baseUrl?: string
	port?: number | string
}

/**
 * Re-export of the ofetch HTTP utility
 * @example
 * ```ts
 * useApiFetch("http://localhost:3000/api/test)
 * ```
 * @param {IOptions} options
 * @returns {$Fetch}
 */
export const useApiFetch = (options: FetchOptions): $Fetch => {
	return ofetch.create({
		...options,
		baseURL: `http://localhost:${ process.env.PORT }/api`,
	})
}
