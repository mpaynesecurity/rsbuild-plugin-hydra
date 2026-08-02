/**
 * @module Logger Logging utility implemented through UnJS/Consola
 *
 * ### Log levels
 * | 0                | 1               | 2              | 3                  | 4              | 5              |
 * |------------------|-----------------|----------------|--------------------|----------------|----------------|
 * | Fatal & Error    | Warnings        | Normal         | Information        | Debug          | Trace          |
 * | ---------------- | --------------- | -------------- | ------------------ | -------        | -------        |
 * | logger.fatal()   | logger.warn()   | logger.log()   | logger.info()      | logger.debug() | logger.trace() |
 * | logger.error()   |                 |                | logger.success()   |                |                |
 * |                  |                 |                | logger.ready()     |                |                |
 * |                  |                 |                | logger.start()     |                |                |
 */

import {
	type ConsolaInstance,
	type ConsolaOptions,
	type ConsolaReporter,
	type InputLogObject,
	type LogObject,
	type LogType,
	createConsola,
} from "consola/core"
import { colors } from "consola/utils"

const { bgBlack, magenta, yellow, blue, green, white } = colors

interface ExtendedOptions extends Omit<ConsolaOptions, "types"> {
	/**
	 * Allows for dynamic/custom log types
	 * @example
	 * ```ts
	 * import {createConsola} from "consola/core"
	 *  const logger = createConsola({
	 *      types: {
	 *          myCustomType: {
	 *              tag: "my-custom-type-tag"
	 *          }
	 *      }
	 *  })
	 * ```
	 */
	types: Record<LogType, InputLogObject> & Record<string, InputLogObject>
}

/**
 * Reporters are the destinations or formatters that determine exactly how and where your log messages are displayed
 * @returns ConsolaReporter[]
 * @satisfies ConsolaReporter[]
 * @see https://dev.to/murtuzaalisurti/elegant-console-logs-with-consola-4819
 */
export const sharedReporters: ConsolaReporter[] = [
	{
		/**
		 * Every reporter receives a unified payload containing the complete context of the message execution
		 * @param {LogObject} logObj
		 * @param {{options: ConsolaOptions}} ctx
		 */
		log: (logObj: LogObject, ctx: { options: ConsolaOptions }) => {
			switch( ctx.options.level ) {
				case 0:
					bgBlack(magenta(JSON.stringify(logObj.message)))
					break
				case 1:
					bgBlack(yellow(JSON.stringify(logObj.message)))
					break
				case 2:
					bgBlack(white(JSON.stringify(logObj.message)))
					break
				case 3:
					bgBlack(blue(JSON.stringify(logObj.message)))
					break
				case 4:
					bgBlack(blue(JSON.stringify(logObj.message)))
					break
				case 5:
					bgBlack(green(JSON.stringify(logObj.message)))
					break
				default:
					bgBlack(JSON.stringify(logObj.message))
			}
		},
	},
]

/**
 * @returns ConsolaOptions
 * @satisfies ConsolaOptions
 * */
export const sharedOptions: ExtendedOptions = {
	reporters: [
		...sharedReporters,
	],
	formatOptions: {},
	types: {
		debug: {
			tag: "debug",
			type: "debug",
		},
		error: {
			tag: "error",
			type: "error",
		},
		fail: {
			tag: "failure",
			type: "fail",
		},
		fatal: {
			tag: "fatal",
			type: "fatal",
		},
		info: {
			tag: "info",
			type: "info",
		},
		warn: {
			tag: "warning",
			type: "warn",
		},
		// The remaining options are required to satisfy the interface
		box: {},
		log: {},
		ready: {},
		silent: {},
		start: {},
		success: {},
		trace: {},
		verbose: {},
		
	},
	// The remaining options are required to satisfy the interface
	defaults: {},
	level: 0,
	throttle: 0,
	throttleMin: 0,
}


/**
 * Base logger function
 * @returns {ConsolaInstance}
 */
export const logger: ConsolaInstance = createConsola({
	...sharedOptions,
})
