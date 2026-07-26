import { Card } from "@/components"
import { hc } from "hono/client"
import { createResource, For, Show } from "solid-js"
import { type AppType } from "../api/os-info"

const client = hc<AppType>("http://localhost:3001/api/os-info")

const fetchOsInfo = async () => {
	const response = await client.index.$get()
	
	if( response.ok ) {
		return await response.json()
	}
}

export default () => {
	const [ stats ] = createResource(fetchOsInfo)
	
	return (
		<>
			{/* Handle Solid's loading and error states natively */ }
			<Show when={ !stats.loading } fallback={ <p>Loading metrics...</p> }>
				<Show when={ !stats.error }>
					<div class={ "flex gap-5 mt-5 justify-center" }>
						<Card
							headerContent={
								<h1 class={ "text-cyan-50 mb-3 text-center" }><strong>Host Stats</strong></h1>
							}
							bodyContent={
								<ul>
									<li class={ "text-cyan-50" }><strong>Host:</strong> { stats()?.hostName }</li>
									<li class={ "text-cyan-50" }><strong>Arch:</strong> { stats()?.cpuArch }</li>
									<li class={ "text-cyan-50" }><strong>Memory:</strong> { stats()?.totalMemory }</li>
									<li class={ "text-cyan-50" }><strong>CPUs:</strong> { stats()?.numberOfCPUs }</li>
									<li class={ "text-cyan-50" }><strong>CPU Load:</strong> { stats()?.currentCpuLoad.toFixed(2) }%</li>
									<li class={ "text-cyan-50" }><strong>Uptime:</strong> { stats()?.systemUptime } seconds</li>
								</ul>
							} />
						<Card
							headerContent={
								<h1 class={ "text-cyan-50 mb-3 text-center" }>
									<strong>Network Interfaces</strong
									></h1>
							}
							bodyContent={
								<For each={ stats()?.nics }>
									{ (item) => (
										<div class={ "grid grid-cols-2 gap-5" }>
											<p class={ "text-cyan-50" }>IP: { item?.address }</p>
											<p class={ "text-cyan-50" }>Mac: { item?.mac }</p>
										</div>
									) }
								</For>
							} />
					</div>
				</Show>
			</Show>
		
		</>
	)
}