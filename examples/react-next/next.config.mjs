/** @type {import('next').NextConfig} */
const nextConfig = {
	// Workspace packages ship compiled dist, but transpiling keeps the "use client"
	// boundaries + ESM resolution robust across Next versions.
	transpilePackages: ["@gehu-js/core", "@gehu-js/react"],
};

export default nextConfig;
