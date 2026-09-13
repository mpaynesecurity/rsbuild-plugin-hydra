/**
 * @module HTTP Collection of http related helper functions and utilities
 */
import { type Hono } from "hono"

import { hc, type ClientRequestOptions } from "hono/client"

/**
 * 1. Accepts the raw Hono server app type directly
 * 2. Bypass deep inner constraints by passing it to typeof hc
 */
export type RpcClient<T extends Hono> = ReturnType<typeof hc<T>>


/**
 * @interface RpcClientOptions
 */
export interface RpcClientOptions {
	/** The base domain or IP (e.g., 'https://my-app.com', 'localhost') */
	host: string
	/** Optional override if the app runs on a non-standard port */
	port: number | string
	/**
	 * Custom url path prefix such as "/api/v1"
	 * */
	prefix: string
	/** Standard Hono client configuration (custom fetch, headers, etc.) */
	honoOptions?: ClientRequestOptions
}

/**
 * Small wrapper around the Hono RPC Client
 * @example
 * ```ts
 * import { useRpcClient } from "@mpaynesecurity/rsbuild-plugin-hydra/http"
 *
 * const client = useRpcClient<AppType>({
 * 	host: "http://localhost",
 * 	port: 3000,
 * 	prefix: "/api/users",
 * })
 *
 * const response = await client.index.$get()
 *
 * if(response.ok) {
 * 	return await response.json()
 *}
 * ```
 * @param config
 * @returns {RpcClient}
 * @see RpcClient
 */
export const useRpcClient = <T extends Hono>(config: RpcClientOptions): RpcClient<T> => {
	const pathPrefix = config.prefix
	
	/*
	 * Use the native URL API to clean up formatting automatically.
	 * This handles missing protocols, trailing slashes, and edge cases
	 */
	const rawHost = config.host.startsWith("http") ? config.host : `https://${config.host}`
	const urlObj = new URL(rawHost)
	
	// Inject custom port
	if(config.port) {
		urlObj.port = config.port.toString()
	}
	
	/** Combine host/port with path prefix. urlObj.origin handles the protocol + host + port calculation */
	const cleanPrefix = pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`
	const fullTargetUrl = `${urlObj.origin}${cleanPrefix}`
	
	/** Build and return the client */
	return hc<T>(fullTargetUrl, config.honoOptions)
}


/**
 * The request has been received but not yet acted upon. It is non-committal, meaning that there is no way in HTTP to later send an asynchronous response indicating the outcome of processing the request. It is intended for cases where another process or server handles the request, or for batch processing.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-6.3.3
 */
export const ACCEPTED = 202

/**
 * The server, while acting as a gateway or proxy, received an invalid response from an inbound server it accessed while attempting to fulfill the request.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-6.6.3
 */
export const BAD_GATEWAY = 502

/**
 * Server could not understand the request due to invalid syntax.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-6.5.1
 */
export const BAD_REQUEST = 400

/**
 * The request has succeeded and a new resource has been created as a result of it. This is typically the response sent after a PUT request.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-6.3.2
 */
export const CREATED = 201

/**
 * The server encountered an unexpected condition that prevented it from fulfilling the request.
 *
 * @see https://tools.ietf.org/html/rfc7231#section-6.6.1
 */
export const INTERNAL_SERVER_ERROR = 500