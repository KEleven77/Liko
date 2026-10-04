import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const visited = new Set();
const packages = [];
const readPackage = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

function resolvePackage(name, from) {
  const direct = join(from, "node_modules", name);
  if (existsSync(join(direct, "package.json"))) return realpathSync(direct);
  const require = createRequire(join(from, "package.json"));
  let dir = dirname(require.resolve(name));
  while (true) {
    if (existsSync(join(dir, "package.json")) && readPackage(dir).name === name) {
      return realpathSync(dir);
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Cannot locate package metadata: " + name);
    dir = parent;
  }
}

function visit(name, from, resolvedDir) {
  const dir = resolvedDir ?? resolvePackage(name, from);
  if (visited.has(dir)) return;
  visited.add(dir);
  const pkg = readPackage(dir);
  const files = readdirSync(dir).filter((file) =>
    /^(?:licen[sc]e|copying|notice)(?:[.-].*)?$/i.test(file),
  ).sort();
  if (files.length === 0) throw new Error("Missing license text: " + pkg.name);
  packages.push({
    name: pkg.name,
    version: pkg.version,
    license: pkg.license ?? "See license text",
    texts: files.map((file) => file + "\n" + readFileSync(join(dir, file), "utf8")),
  });
  for (const dependency of Object.keys(pkg.dependencies ?? {}).sort()) visit(dependency, dir);
  for (const dependency of Object.keys(pkg.optionalDependencies ?? {}).sort()) {
    let optionalDir;
    try {
      optionalDir = resolvePackage(dependency, dir);
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      continue;
    }
    visit(dependency, dir, optionalDir);
  }
}

for (const name of Object.keys(readPackage(root).dependencies ?? {}).sort()) visit(name, root);
packages.sort((a, b) => a.name.localeCompare(b.name, "en"));
const sections = [
  "Liko third-party notices",
  "Generated from installed runtime dependencies. Original terms below remain unchanged.",
  "This file does not grant a license for the entire Liko theme or unresolved upstream assets.",
  ...packages.map((pkg) => [
    pkg.name + "@" + pkg.version,
    "Declared license: " + JSON.stringify(pkg.license),
    ...pkg.texts,
  ].join("\n\n")),
];
writeFileSync(join(root, "public", "THIRD_PARTY_NOTICES.txt"), sections.join("\n\n--------------------\n\n") + "\n");
console.log("Collected license notices for " + packages.length + " runtime packages.");
