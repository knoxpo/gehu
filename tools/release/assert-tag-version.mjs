import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (!tag) {
	throw new Error("missing tag name");
}

const match = /^v(\d+\.\d+\.\d+(?:-next\.\d+)?)$/.exec(tag);
if (!match) {
	throw new Error(`tag "${tag}" must look like vX.Y.Z or vX.Y.Z-next.N`);
}

const expectedVersion = match[1];
const packageDirs = readdirSync(join(root, "packages"), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => join(root, "packages", entry.name));

const packageVersions = new Map();

for (const dir of packageDirs) {
	const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	if (!pkg.name?.startsWith("@gehu-js/")) continue;
	packageVersions.set(pkg.name, pkg.version);
}

const versions = [...new Set(packageVersions.values())];
if (versions.length !== 1) {
	throw new Error(`publishable packages are not lockstep versioned: ${versions.join(", ")}`);
}

if (versions[0] !== expectedVersion) {
	throw new Error(`tag ${tag} does not match package version ${versions[0]}`);
}

console.log(`tag ${tag} matches ${packageVersions.size} package versions`);
