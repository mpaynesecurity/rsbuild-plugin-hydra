import { createSignal } from "solid-js"
import { A } from "@solidjs/router"

export const Navbar = () => {
	const [ isOpen, setIsOpen ] = createSignal(false)
	
	return (
		<nav class="bg-navbar shadow-md w-full top-0">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-end h-16">
					
					{/* Desktop Menu */ }
					<div class="hidden md:flex space-x-8">
						<A href="/" class="nav-link">Home</A>
						<A href="#" class="nav-link">Databases</A>
						<A href="/api/openapi" class="nav-link">OpenAPI</A>
						<A href="/api/scalar" class="nav-link">Scalar</A>
					</div>
					
					{/* Desktop CTA Button */ }
					{/* <div class="hidden md:block"> */ }
					{/* 	<a href="#" class="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"> */ }
					{/* 		Sign Up */ }
					{/* 	</a> */ }
					{/* </div> */ }
					
					{/* Mobile Menu Button */ }
					<div class="md:hidden flex items-center">
						<button
							onClick={ () => setIsOpen(!isOpen()) }
							type="button"
							class="text-gray-400 hover:text-gray-600 focus:outline-none"
							aria-label="Toggle navigation menu"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								{ isOpen() ? (
									// "X" close icon when open
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								) : (
									  // Hamburger icon when closed
									  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
								  ) }
							</svg>
						</button>
					</div>
				
				</div>
			</div>
			
			{/* Mobile Menu */ }
			<div
				class={ `md:hidden bg-navbar/60 px-4 pt-2 pb-4 space-y-1 shadow-inner ${ isOpen() ? "block" : "hidden" }` }
			>
				<A href="/" class="mobile-nav-link">Home</A>
				<a href="#" class="mobile-nav-link">Databases</a>
				<A href="/api/openapi" class="mobile-nav-link">OpenAPI</A>
				<A href="/api/scalar" class="mobile-nav-link">Scalar</A>
			</div>
		</nav>
	)
}
