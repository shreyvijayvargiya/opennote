import React from "react";
import Link from "next/link";
import SEO from "../lib/modules/SEO";

export default function Custom404() {
	// Use custom SEO for 404 page
	const customSEO = {
		title: "404 - Page Not Found - SAAS Starter",
		description: "The page you are looking for does not exist.",
		keywords: "404, page not found, error",
		ogImage: "/og-default.png",
		ogType: "website",
		noindex: true, // Hide 404 pages from search engines
	};

	return (
		<>
			<SEO customSEO={customSEO} />
			<div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
				<div className="text-center">
					<h1 className="text-6xl font-bold text-zinc-900 mb-4">404</h1>
					<h2 className="text-2xl font-semibold text-zinc-700 mb-4">
						Page Not Found
					</h2>
					<p className="text-zinc-600 mb-8">
						The page you are looking for does not exist.
					</p>
					<Link
						href="/"
						className="inline-block px-6 py-3 bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors"
					>
						Go Back Home
					</Link>
				</div>
			</div>
		</>
	);
}

