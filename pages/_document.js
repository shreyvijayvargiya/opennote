import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Document
 *
 * Note: For route-specific SEO tags, edit lib/config/seo.js
 * The SEO component in _app.js will automatically apply tags based on routes.
 *
 * This file handles base HTML structure and static meta tags.
 */
export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />

				{/* Base meta tags - route-specific tags are handled in lib/modules/SEO */}
				<meta name="theme-color" content="#18181b" />
				{/* Apply the saved light/dark mode and color theme before first paint (no flash). */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var r=document.documentElement,m=localStorage.getItem('theme'),t=localStorage.getItem('rowtabs-theme');if(m==='dark'||(!m&&matchMedia('(prefers-color-scheme: dark)').matches))r.classList.add('dark');if(t&&t!=='default')r.setAttribute('data-theme',t)}catch(e){}})()`,
					}}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
				<script src="/webmcp.js" defer></script>
			</body>
		</Html>
	);
}
