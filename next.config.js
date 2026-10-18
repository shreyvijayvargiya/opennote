/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
	outputFileTracingRoot: path.join(__dirname),
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	images: {
		domains: [
			"lh3.googleusercontent.com",
			"images.unsplash.com",
			"storage.googleapis.com",
			"api.dicebear.com",
		],
		minimumCacheTTL: 60,
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Permissions-Policy",
						value: "payment=(self), interest-cohort=()",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, max-age=0",
					},
				],
			},
		];
	},
	webpack: (config) => {
		// docs/*.md are imported as plain strings (rendered by the Getting started page)
		config.module.rules.push({ test: /\.md$/, type: "asset/source" });
		return config;
	},
};

export default nextConfig;
