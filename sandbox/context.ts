import pino from "pino"

export const baseLogger = pino({
	level: "error",
})

export type Ctx = {
	Variables: {
		message: string
		logger: pino.Logger
	}
}