import { type Logger } from "pino"

export type Ctx = {
	Variables: {
		message: string
		logger: Logger
	}
}