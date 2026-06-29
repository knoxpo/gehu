import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const distTag = process.argv[2];

if (distTag !== "latest" && distTag !== "next") {
	throw new Error(`dist-tag must be "latest" or "next", got "${distTag ?? ""}"`);
}

const root = process.cwd();
const packageDirs = readdirSync(join(root, "packages"), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => join(root, "packages", entry.name));

const published = [];
const skipped = [];

for (const dir of packageDirs) {
	const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	if (!pkg.name?.startsWith("@gehu-js/") || pkg.private) continue;

	const spec = `${pkg.name}@${pkg.version}`;

	try {
		const version = execFileSync("npm", ["view", spec, "version", "--json"], {
			cwd: dir,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();

		if (version.replaceAll('"', "") === pkg.version) {
			skipped.push(spec);
			continue;
		}
	} catch {
		// Not published yet at this version; publish below.
	}

	execFileSync(
		"npm",
		["publish", "--provenance", "--access", "public", "--tag", distTag],
		{
			cwd: dir,
			stdio: "inherit",
			env: process.env,
		},
	);
	published.push(spec);
}

console.log(`published: ${published.length ? published.join(", ") : "none"}`);
console.log(`skipped: ${skipped.length ? skipped.join(", ") : "none"}`);
