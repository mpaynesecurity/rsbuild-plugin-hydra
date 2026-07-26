import { Hono } from "hono"
import { arch, cpus, hostname, uptime, totalmem, networkInterfaces } from "node:os"

const app = new Hono()
	.get("/", (c) => {
		//  Resolve all async system calls concurrently first
		const cpuList = cpus()
		
		// Calculate current CPU load percentage using core times
		// (Bypasses the slow shell execution of systeminformation)
		const totalIdle = cpuList.reduce((acc, core) => acc + core.times.idle, 0)
		const totalTick = cpuList.reduce((acc, core) =>
			acc + Object.values(core.times).reduce((a, b) => a + b, 0), 0,
		)
		const cpuLoad = totalTick > 0 ? (1 - totalIdle / totalTick) * 100 : 0
		
		return c.json({
			currentCpuLoad: cpuLoad,       // Real-time calculation (~0ms)
			numberOfCPUs: cpuList.length,  // Native count
			nics: Object.values(networkInterfaces()).flat(),     // Native network mapping
			cpuArch: arch(),
			hostName: hostname(),
			totalMemory: totalmem(),       // Native memory byte count
			systemUptime: uptime(),
		})
	})
export type AppType = typeof app

export default app


