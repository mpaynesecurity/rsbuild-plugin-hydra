import { createResource, Show } from "solid-js"

const fetchTest = async () => await fetch("/api/test").then((d) => d.json())

export default () => {
	const [ testData ] = createResource<{ data: string }>(fetchTest)
	
	return (
		<div class="bg-gray-800 flex flex-col">
			<Show when={ testData() } fallback={ <p class={ "text-gray-200" }>{ <p>No Test Data</p> }</p> }>
				<p class="text-gray-200">{ testData()?.data }</p>
			</Show>
		</div>
	)
}