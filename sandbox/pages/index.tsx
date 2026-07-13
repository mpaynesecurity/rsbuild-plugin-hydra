import { createResource, Show } from "solid-js"
import { Navbar } from "../components/navbar"

const fetchTest = async () => await fetch("/api/test").then((d) => d.json())

export const Home = () => {
	const [ testData ] = createResource<{ message: string }>(fetchTest)
	
	return (
		<>
			<Navbar />
			<div class="bg-gray-800 flex">
				<Show when={ testData() } fallback={ <p class={ "text-gray-200" }>{ <p>No Test Data</p> }</p> }>
					<p class="text-gray-200" id="fetchTest">{ testData()?.message }</p>
				</Show>
			</div>
		</>
	
	)
}