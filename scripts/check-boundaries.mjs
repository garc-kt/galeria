import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const violations = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(full)) check(full);
  }
}

function importsOf(content) {
  const all = [];
  const typeOnly = new Set();
  const importRe = /from\s+["']([^"']+)["']/g;
  let match;
  while ((match = importRe.exec(content))) all.push(match[1]);

  const typeRe = /import\s+type\s+[^;]*?from\s+["']([^"']+)["']/g;
  while ((match = typeRe.exec(content))) typeOnly.add(match[1]);

  return all.filter((spec) => !typeOnly.has(spec));
}

function check(file) {
  const normalized = file.replace(/\\/g, "/");
  const content = readFileSync(file, "utf8");
  const imports = importsOf(content);
  const isUi = normalized.includes("/components/ui/");
  const isFeatureComponent = normalized.includes("/features/") && normalized.includes("/components/");
  const isFeatureServer = normalized.includes("/features/") && normalized.includes("/server/");
  const isLib = normalized.startsWith("src/lib/");

  for (const spec of imports) {
    if (isUi && (spec.startsWith("@/features/") || spec.startsWith("@/server/") || spec.startsWith("@/db/"))) {
      violations.push(normalized + " -> " + spec + " (UI must stay domain-free)");
    }
    if (isFeatureComponent && (spec.startsWith("@/server/") || spec.startsWith("@/db/"))) {
      violations.push(normalized + " -> " + spec + " (feature component must not import server/db)");
    }
    if (isFeatureComponent && /^@\/features\/[^/]+\/server\//.test(spec)) {
      violations.push(normalized + " -> " + spec + " (feature component must not import another feature server)");
    }
    if (isFeatureServer && /^@\/features\/[^/]+\/components\//.test(spec)) {
      violations.push(normalized + " -> " + spec + " (feature server must not import UI)");
    }
    if (normalized.startsWith("src/features/") && spec.startsWith("@/app/")) {
      violations.push(normalized + " -> " + spec + " (features must not import app)");
    }
    if (isLib && (spec.startsWith("@/features/") || spec.startsWith("@/server/") || spec.startsWith("@/db/") || spec.startsWith("@/app/"))) {
      violations.push(normalized + " -> " + spec + " (lib must stay isomorphic)");
    }
  }
}

if (statSync("src").isDirectory()) walk("src");

if (violations.length > 0) {
  console.error("Boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Boundaries OK");
