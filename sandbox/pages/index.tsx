import { Card } from "@/components"
import { createResource, For, Show } from "solid-js"
import { type AppType } from "@/api/os-info.ts"
import { useRpcClient } from "@mpaynesecurity/rsbuild-plugin-hydra/http"

const client = useRpcClient<AppType>({
	host: "http://localhost",
	port: 3005,
	prefix: "/api/os-info",
})

const fetchOsInfo = async () => {
	const response = await client.index.$get()
	
	if(response.ok) {
		return await response.json()
	}
}

export default () => {
	const [stats] = createResource(fetchOsInfo)
	
	return (
		<div>
			{/* Handle Solid's loading and error states natively */}
			<Show when={!stats.loading} fallback={<p>Loading metrics...</p>}>
				<Show when={!stats.error}>
					<div class={"flex gap-5 mt-5 p-2 justify-between md:flex-col"}>
						<Card
							headerContent={
								<h1 class={"text-cyan-50 mb-3 text-center"}><strong>Host Stats</strong></h1>
							}
							bodyContent={
								<ul class="bg-dark">
									<li class={"text-cyan-50"}><strong>Host:</strong> {stats()?.hostName}</li>
									<li class={"text-cyan-50"}><strong>Arch:</strong> {stats()?.cpuArch}</li>
									<li class={"text-cyan-50"}><strong>Memory:</strong> {stats()?.totalMemory}</li>
									<li class={"text-cyan-50"}><strong>CPUs:</strong> {stats()?.numberOfCPUs}</li>
									<li class={"text-cyan-50"}><strong>CPU Load:</strong> {stats()?.currentCpuLoad.toFixed(2)}%</li>
									<li class={"text-cyan-50"}><strong>Uptime:</strong> {stats()?.systemUptime} seconds</li>
								</ul>
							} />
						<Card
							bodyContent={
								<div class="w-full text-cyan-50 bg-dark rounded-md border border-slate-800 overflow-hidden">
									
									{/* HEADER ROW - 4 locked columns, perfectly aligned and centered */}
									<div class="grid grid-cols-4 gap-4 bg-slate-900 px-4 py-3 text-center font-bold border-b border-slate-800 text-sm tracking-wide">
										<div>IP Family</div>
										<div>IP Address</div>
										<div>Mac Address</div>
										<div>Netmask</div>
									</div>
									
									{/* DATA ROWS - Guaranteed to align with the headers above */}
									<div class="divide-y divide-slate-800">
										<For each={stats()?.nics}>
											{(item) => (
												<div class="grid grid-cols-4 gap-4 px-4 py-3 text-center items-center text-sm hover:bg-slate-800/30 transition-colors">
													<div class="font-medium text-cyan-200">{item?.family}</div>
													<div class="font-mono break-all selection:bg-cyan-500/30">{item?.address}</div>
													<div class="font-mono text-xs tracking-tight">{item?.mac}</div>
													<div class="font-mono">{item?.netmask}</div>
												</div>
											)}
										</For>
									</div>
								
								</div>
							}
						/>
					
					</div>
				</Show>
			</Show>
		</div>
	)
}