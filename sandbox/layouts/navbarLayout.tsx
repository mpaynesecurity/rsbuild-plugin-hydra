import type { ParentProps } from "solid-js"
import { Navbar } from "@/components"

export const NavbarLayout = (props: ParentProps) => {
	return (
		<>
			<Navbar />
			{ props.children }
		</>
	)
}