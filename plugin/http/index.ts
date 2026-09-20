/**
 * Collection of http related helper functions and utilities
 *
 * @module HTTP
 */

import { type Hono } from "hono"

import { type ClientRequestOptions, hc } from "hono/client"

/**
 * Accept the raw Hono server app type directly, and bypass deep inner constraints by passing typeof hc to ReturnType
 */
export type RpcClient<T extends Hono> = ReturnType<typeof hc<T>>


/**
 * @interface RpcClientOptions
 */
export interface RpcClientOptions {
	/** The base domain or IP (e.g., "http://my-app.com", "http://localhost:8081") */
	host: string
	
	/** Optional override if the app runs on a non-standard port */
	port: number | string
	
	/** Custom url path prefix (e.g, "/api/v1") */
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
	
	/**
	 * Use the native URL API to clean up formatting automatically.
	 * This handles edge cases such as missing protocols and trailing slashes.
	 */
	const rawHost = config.host.startsWith("http") ? config.host : `https://${config.host}`
	const urlObj = new URL(rawHost)
	
	// Inject custom port
	if(config.port) {
		urlObj.port = config.port.toString()
	}
	
	/** Combine host/port with path prefix. urlObj.origin handles the protocol + host + port calculation. */
	const cleanPrefix = pathPrefix.startsWith("/") ? pathPrefix : `/${pathPrefix}`
	const fullTargetUrl = `${urlObj.origin}${cleanPrefix}`
	
	/** Build and return the client. */
	return hc<T>(fullTargetUrl, config.honoOptions)
}

/**
 * Collection of common http status codes
 */
export const enum HttpStatusCodes {
	/** Request has succeeded
	 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.1
	 * @type {HttpStatusCodes.OK}
	 */
	OK = 200,
	
	/**
	 * The request has succeeded and a new resource has been created as a result of it. This is typically the response sent after a PUT request.
	 * @type {HttpStatusCodes.CREATED}
	 * @see https://tools.ietf.org/html/rfc7231#section-6.3.2
	 */
	CREATED = 201,
	
	/**
	 * The request has been accepted for processing, but the processing has not been completed.
	 * @type {HttpStatusCodes.ACCEPTED}
	 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.3
	 */
	ACCEPTED = 202,
	
	/**
	 *  The server has successfully fulfilled the request and that there is no additional
	 *  content to send in the response payload body.
	 *  @type {HttpStatusCodes.NO_CONTENT}
	 *  @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.3.5
	 */
	NO_CONTENT = 204,
	
	/**
	 * Indicates that the server cannot or will not process the request due to something that is perceived to be
	 * a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).
	 * @type {HttpStatusCodes.BAD_REQUEST}
	 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1
	 */
	BAD_REQUEST = 400,
	
	/**
	 * The server encountered an unexpected condition that prevented it from fulfilling the request.
	 * @type {HttpStatusCodes.INTERNAL_SERVER_ERROR}
	 * @see https://tools.ietf.org/html/rfc7231#section-6.6.1
	 */
	INTERNAL_SERVER_ERROR = 500,
	
	/***
	 * This error response means that the server, while working as a gateway to get a response needed to handle the request, got an invalid response.
	 * @type {HttpStatusCodes.B`}
	 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.3
	 */
	BAD_GATEWAY = 502
}