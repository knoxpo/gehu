import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const packagesDir = join(root, "packages");
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => join(packagesDir, entry.name));

const normalize = (value) => value.replace(/^\.\//, "");

const collectExports = (value, out = new Set()) => {
	if (typeof value === "string") {
		out.add(normalize(value));
		return out;
	}
	if (!value || typeof value !== "object") return out;
	for (const nested of Object.values(value)) collectExports(nested, out);
	return out;
};

for (const dir of packageDirs) {
	const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
	if (!pkg.name?.startsWith("@gehu-js/")) continue;

	const cacheDir = mkdtempSync(join(tmpdir(), "gehu-npm-cache-"));
	const output = execFileSync(
		"npm",
		["pack", "--json", "--dry-run", "--cache", cacheDir],
		{ cwd: dir, encoding: "utf8" },
	);
	rmSync(cacheDir, { recursive: true, force: true });

	const [{ files }] = JSON.parse(output);
	const packedFiles = files.map((file) => file.path);
	const packedSet = new Set(packedFiles);
	const missing = ["package.json", "README.md", "LICENSE"].filter((file) => !packedSet.has(file));
	if (missing.length > 0) {
		throw new Error(`${pkg.name} is missing packed files: ${missing.join(", ")}`);
	}

	for (const file of packedFiles) {
		const allowedTopLevel = file === "package.json" || file === "README.md" || file === "LICENSE" || file === "CHANGELOG.md";
		if (!allowedTopLevel && !file.startsWith("dist/")) {
			throw new Error(`${pkg.name} packs unexpected file: ${file}`);
		}
		if (/(\.test-d\.)|(^|\/)(src|test|tests|__tests__)\//.test(file)) {
			throw new Error(`${pkg.name} packs test or source artifact: ${file}`);
		}
		if (file.startsWith("dist/esm/") && (file.endsWith(".d.ts") || file.endsWith(".d.ts.map"))) {
			throw new Error(`${pkg.name} packs duplicate declarations in dist/esm: ${file}`);
		}
	}

	const expectedEntries = [
		pkg.main,
		pkg.module,
		pkg.types,
		...collectExports(pkg.exports),
	].filter(Boolean).map(normalize);

	for (const entry of expectedEntries) {
		if (!packedSet.has(entry)) {
			throw new Error(`${pkg.name} is missing published entrypoint: ${entry}`);
		}
	}
}

console.log("pack validation passed");
