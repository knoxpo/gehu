import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) => {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(path);
			continue;
		}
		if (
			/\.test-d\./.test(entry.name) ||
			(path.includes(join("dist", "esm")) &&
				(entry.name.endsWith(".d.ts") || entry.name.endsWith(".d.ts.map")))
		) {
			rmSync(path, { force: true });
		}
	}
};

const distDir = join(process.cwd(), "dist");
try {
	if (statSync(distDir).isDirectory()) walk(distDir);
} catch {
	// Nothing to prune when dist does not exist yet.
}
