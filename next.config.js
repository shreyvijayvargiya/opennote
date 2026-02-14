/** @type {import('next').NextConfig} */
const path = require("path");

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
	webpack: (config, { isServer }) => {
		if (!isServer) {
			config.resolve.alias["yjs"] = path.resolve(__dirname, "node_modules/yjs");
		}
		return config;
	},
};

module.exports = nextConfig;
