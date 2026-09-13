import { Card } from "@/components"
import { useRpcClient } from "@mpaynesecurity/rsbuild-plugin-hydra/http"
import { type AppType } from "@/api/context"
import { createResource, createSignal } from "solid-js"

const rpcClient = useRpcClient<AppType>({
	host: "http://localhost",
	port: 3005,
	prefix: "/api/context",
})

export default () => {
	let inputRef!: HTMLInputElement
	
	const getCtx = async () => {
		const res = await rpcClient.index.$get()
		return res.text()
	}
	
	// 1. Initialize the remote backend value into a Solid resource
	const [backendContext] = createResource(getCtx)
	
	// 2. Manage a secondary view signal to force instant UI updates
	const [localView, setLocalView] = createSignal<string>("")
	
	const onSubmit = async (e: SubmitEvent) => {
		e.preventDefault()
		if(!inputRef) return
		
		const pendingText = inputRef.value
		
		// 3. Immediately apply the value locally to refresh your DOM instantly
		setLocalView(pendingText)
		inputRef.value = ""
		
		// 4. Send the data to the Hydra-managed server route in the background
		await rpcClient.index.$post({
			form: {
				msg: pendingText,
			},
		})
	}
	
	return (
		<div class="mx-auto max-w-xl">
			<Card
				bodyContent={
					<div class="p-5 flex flex-col items-center justify-center gap-5 text-center rounded-lg">
						{/* 5. Fall back to the backend context initial string if no local submission has happened yet */}
						
						<p class="text-gray-200 text-center">
							Hono Context: {localView() || backendContext()}
						</p>
						{/* Added items-center and justify-center to keep the row balanced */}
						<form onSubmit={onSubmit} class="flex items-center justify-center gap-3 w-full max-w-md">
							<input
								class="text-gray-200 px-3 py-2 bg-slate-800 border border-slate-700 rounded-sm focus:outline-none focus:border-indigo-500 flex-1"
								ref={inputRef}
								type="text"
								placeholder="Enter new context..."
							/>
							<button
								class="bg-indigo-600 px-4 py-2 rounded-sm text-gray-100 hover:bg-indigo-700 active:bg-indigo-900 transition-colors whitespace-nowrap"
								type="submit"
							>
								Set Context
							</button>
						</form>
					</div>
					
				} />
		</div>
	
	)
}
