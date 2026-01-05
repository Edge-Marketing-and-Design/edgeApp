"use strict";

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { spawnSync } = require("child_process");

const EDGE_SENTINEL_FILE = "edgeapp.project.json";
const EDGE_DIR = ".edge";
const EDGE_MODULES_DIR = path.join(EDGE_DIR, "modules");
const EDGE_REGISTRY_FILE = path.join(EDGE_MODULES_DIR, "registry.ts");
const EDGE_REGISTRY_MARKER = "EDGE MODULE REGISTRY";
const EDGE_RUNTIME_DIR = "edge-modules";
const EDGE_RUNTIME_REGISTRY_FILE = path.join(EDGE_RUNTIME_DIR, "registry.ts");
const EDGE_RUNTIME_IMPORT_MARKER = "EDGE MODULE IMPORTS";
const EDGE_RUNTIME_REGISTRY_MARKER = "EDGE MODULE REGISTRY";
const EDGE_MODULE_MANIFEST = "edge-module.json";
const EDGE_MODULE_TEMPLATE_DIR = path.join(
  __dirname,
  "templates",
  "module-starter"
);

function resolveAbsolutePath(root, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
}

function isEdgeProject(projectRoot) {
  return fs.existsSync(path.join(projectRoot, EDGE_SENTINEL_FILE));
}

function ensureDir(dirPath) {
  return fsp.mkdir(dirPath, { recursive: true });
}

async function ensureRegistryFile(projectRoot) {
  const registryPath = path.join(projectRoot, EDGE_REGISTRY_FILE);
  if (fs.existsSync(registryPath)) {
    return registryPath;
  }

  await ensureDir(path.dirname(registryPath));
  const content = [
    "export const edgeModuleRegistry = {",
    `  // ${EDGE_REGISTRY_MARKER} START`,
    `  // ${EDGE_REGISTRY_MARKER} END`,
    "};",
    "",
  ].join("\n");
  await fsp.writeFile(registryPath, content, "utf8");
  return registryPath;
}

async function ensureRuntimeRegistryFile(projectRoot) {
  const registryPath = path.join(projectRoot, EDGE_RUNTIME_REGISTRY_FILE);
  if (fs.existsSync(registryPath)) {
    return registryPath;
  }

  await ensureDir(path.dirname(registryPath));
  const content = [
    "import type { EdgeModuleManifest } from '~/lib/edge-modules/types';",
    "",
    `// ${EDGE_RUNTIME_IMPORT_MARKER} START`,
    `// ${EDGE_RUNTIME_IMPORT_MARKER} END`,
    "",
    "export const edgeModuleRegistry: Record<string, EdgeModuleManifest> = {",
    `  // ${EDGE_RUNTIME_REGISTRY_MARKER} START`,
    `  // ${EDGE_RUNTIME_REGISTRY_MARKER} END`,
    "};",
    "",
  ].join("\n");
  await fsp.writeFile(registryPath, content, "utf8");
  return registryPath;
}

function readRegistryEntries(registryContent) {
  const startMarker = `// ${EDGE_REGISTRY_MARKER} START`;
  const endMarker = `// ${EDGE_REGISTRY_MARKER} END`;
  const lines = registryContent.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.includes(startMarker));
  const endIndex = lines.findIndex(
    (line, idx) => idx > startIndex && line.includes(endMarker)
  );

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `Registry markers not found in ${EDGE_REGISTRY_FILE}. Expected ${startMarker} and ${endMarker}.`
    );
  }

  const entries = {};
  for (const line of lines.slice(startIndex + 1, endIndex)) {
    const match = line.match(/"([^"]+)":\s*"([^"]+)"/);
    if (match) {
      entries[match[1]] = match[2];
    }
  }

  return { entries, startIndex, endIndex, lines };
}

function readMarkerSection(lines, marker) {
  const startMarker = `// ${marker} START`;
  const endMarker = `// ${marker} END`;
  const startIndex = lines.findIndex((line) => line.includes(startMarker));
  const endIndex = lines.findIndex(
    (line, idx) => idx > startIndex && line.includes(endMarker)
  );

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `Registry markers not found. Expected ${startMarker} and ${endMarker}.`
    );
  }

  return { startIndex, endIndex };
}

function readRuntimeRegistryEntries(registryContent) {
  const lines = registryContent.split(/\r?\n/);
  const { startIndex, endIndex } = readMarkerSection(
    lines,
    EDGE_RUNTIME_REGISTRY_MARKER
  );

  const entries = {};
  for (const line of lines.slice(startIndex + 1, endIndex)) {
    const match = line.match(/"([^"]+)":\s*([a-zA-Z0-9_$]+)/);
    if (match) {
      entries[match[1]] = match[2];
    }
  }

  return { entries, startIndex, endIndex, lines };
}

function toModuleIdentifier(moduleId) {
  const parts = moduleId.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) {
    return "edgeModule";
  }
  const [first, ...rest] = parts;
  const base =
    first.toLowerCase() +
    rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  return base.toLowerCase().endsWith("module") ? base : `${base}Module`;
}

function toModuleLabel(moduleId) {
  const parts = moduleId.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) {
    return "Module";
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPascalCase(moduleId) {
  const parts = moduleId.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) {
    return "Module";
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(moduleId) {
  const pascal = toPascalCase(moduleId);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toPosix(filePath) {
  return filePath.replace(/\\/g, "/");
}

function replaceTokens(content, replacements) {
  let output = content;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.split(token).join(value);
  }
  return output;
}

async function copyTemplateDir(sourceDir, targetDir, replacements) {
  await ensureDir(targetDir);
  const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyTemplateDir(sourcePath, targetPath, replacements);
      continue;
    }
    const content = await fsp.readFile(sourcePath, "utf8");
    const rendered = replaceTokens(content, replacements);
    await ensureDir(path.dirname(targetPath));
    await fsp.writeFile(targetPath, rendered, "utf8");
  }
}

async function createModulePackage({
  moduleId,
  workspaceRoot,
  outputDir,
  label,
  description,
  version,
  packageName,
  route,
}) {
  if (!moduleId) {
    throw new Error("Missing moduleId.");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(moduleId)) {
    throw new Error(
      "Module id must be lowercase alphanumeric with dashes only."
    );
  }
  if (!fs.existsSync(EDGE_MODULE_TEMPLATE_DIR)) {
    throw new Error(`Template directory missing: ${EDGE_MODULE_TEMPLATE_DIR}`);
  }

  const moduleLabel = label || toModuleLabel(moduleId);
  const moduleVersion = version || "0.1.0";
  const moduleDescription = description || `${moduleLabel} module.`;
  const moduleDirName = moduleId.startsWith("module-")
    ? moduleId
    : `module-${moduleId}`;
  const moduleRoot = outputDir
    ? resolveAbsolutePath(workspaceRoot, outputDir)
    : path.join(workspaceRoot, "packages", moduleDirName);

  if (fs.existsSync(moduleRoot)) {
    throw new Error(`Target directory already exists: ${moduleRoot}`);
  }

  const replacements = {
    __MODULE_ID__: moduleId,
    __MODULE_VERSION__: moduleVersion,
    __MODULE_LABEL__: moduleLabel,
    __MODULE_DESCRIPTION__: moduleDescription,
    __MODULE_PACKAGE_NAME__:
      packageName || `@edgedev/${moduleDirName}`,
    __MODULE_ROUTE__: route || `/app/dashboard/${moduleId}`,
    __MODULE_CAMEL__: toCamelCase(moduleId),
    __MODULE_PASCAL__: toPascalCase(moduleId),
  };

  await copyTemplateDir(EDGE_MODULE_TEMPLATE_DIR, moduleRoot, replacements);
  return { moduleRoot, moduleId, packageName: replacements.__MODULE_PACKAGE_NAME__ };
}

async function upsertRuntimeRegistryEntry(projectRoot, manifest) {
  if (!manifest.runtime || !manifest.runtime.target) {
    return null;
  }

  const registryPath = await ensureRuntimeRegistryFile(projectRoot);
  const registryContent = await fsp.readFile(registryPath, "utf8");
  let lines = registryContent.split(/\r?\n/);

  const runtimeExport = manifest.runtime.export || "edgeModule";
  const registryDir = path.join(projectRoot, EDGE_RUNTIME_DIR);
  const targetAbs = resolveAbsolutePath(projectRoot, manifest.runtime.target);
  const relPath = toPosix(path.relative(registryDir, targetAbs));
  const importPath = (relPath.startsWith(".") ? relPath : `./${relPath}`).replace(
    /\.[^.]+$/,
    ""
  );
  const identifier = toModuleIdentifier(manifest.id);
  const importLine = `import { ${runtimeExport} as ${identifier} } from '${importPath}';`;

  const importSection = readMarkerSection(lines, EDGE_RUNTIME_IMPORT_MARKER);
  const existingImports = lines
    .slice(importSection.startIndex + 1, importSection.endIndex)
    .join("\n");
  if (!existingImports.includes(importLine)) {
    lines.splice(importSection.endIndex, 0, importLine);
  }

  const refreshed = lines.join("\n");
  const { entries, startIndex, endIndex, lines: updatedLines } =
    readRuntimeRegistryEntries(refreshed);

  entries[manifest.id] = identifier;
  const sortedLines = Object.keys(entries)
    .sort()
    .map((id) => `  "${id}": ${entries[id]},`);

  const nextLines = [
    ...updatedLines.slice(0, startIndex + 1),
    ...sortedLines,
    ...updatedLines.slice(endIndex),
  ];

  const hadTrailingNewline = registryContent.endsWith("\n");
  const nextContent = nextLines.join("\n") + (hadTrailingNewline ? "\n" : "");
  await fsp.writeFile(registryPath, nextContent, "utf8");
  return { path: registryPath, entry: { id: manifest.id, identifier } };
}

async function upsertRegistryEntry(projectRoot, moduleId, version) {
  const registryPath = await ensureRegistryFile(projectRoot);
  const registryContent = await fsp.readFile(registryPath, "utf8");
  const { entries, startIndex, endIndex, lines } =
    readRegistryEntries(registryContent);

  entries[moduleId] = version;

  const sortedLines = Object.keys(entries)
    .sort()
    .map((id) => `  "${id}": "${entries[id]}",`);

  const nextLines = [
    ...lines.slice(0, startIndex + 1),
    ...sortedLines,
    ...lines.slice(endIndex),
  ];

  const hadTrailingNewline = registryContent.endsWith("\n");
  const nextContent = nextLines.join("\n") + (hadTrailingNewline ? "\n" : "");
  await fsp.writeFile(registryPath, nextContent, "utf8");
  return { path: registryPath, entry: { id: moduleId, version } };
}

function findWorkspaceRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    const pnpmWorkspace = path.join(current, "pnpm-workspace.yaml");
    const packageJson = path.join(current, "package.json");
    if (
      fs.existsSync(pnpmWorkspace) ||
      (fs.existsSync(packageJson) && hasWorkspaceConfig(packageJson))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function hasWorkspaceConfig(packageJsonPath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return Boolean(pkg.workspaces);
  } catch {
    return false;
  }
}

function readWorkspaceGlobs(workspaceRoot) {
  const pnpmWorkspace = path.join(workspaceRoot, "pnpm-workspace.yaml");
  if (!fs.existsSync(pnpmWorkspace)) {
    return ["modules/*", "packages/*"];
  }

  const content = fs.readFileSync(pnpmWorkspace, "utf8");
  const lines = content.split(/\r?\n/);
  const globs = [];
  let inPackages = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("packages:")) {
      inPackages = true;
      continue;
    }
    if (!inPackages) {
      continue;
    }
    if (trimmed.startsWith("-")) {
      const glob = trimmed.slice(1).trim().replace(/^["']|["']$/g, "");
      if (glob) {
        globs.push(glob);
      }
    } else if (!trimmed.startsWith("#") && !trimmed.startsWith("-")) {
      break;
    }
  }

  return globs.length ? globs : ["modules/*", "packages/*"];
}

function expandPackageDirs(workspaceRoot, globs) {
  const dirs = new Set();
  for (const pattern of globs) {
    if (!pattern.endsWith("/*")) {
      continue;
    }
    const baseDir = path.join(workspaceRoot, pattern.slice(0, -2));
    if (!fs.existsSync(baseDir)) {
      continue;
    }
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        dirs.add(path.join(baseDir, entry.name));
      }
    }
  }
  return Array.from(dirs);
}

function getWorkspaceRoot(projectRoot, overrideRoot) {
  if (overrideRoot) {
    return path.resolve(overrideRoot);
  }
  if (process.env.EDGE_MODULE_WORKSPACE_ROOT) {
    return path.resolve(process.env.EDGE_MODULE_WORKSPACE_ROOT);
  }

  return (
    findWorkspaceRoot(projectRoot) ||
    findWorkspaceRoot(path.resolve(__dirname, "..", "..")) ||
    path.resolve(__dirname, "..", "..")
  );
}

function loadModuleManifest(moduleRoot) {
  const packageJsonPath = path.join(moduleRoot, "package.json");
  let manifestPath = path.join(moduleRoot, EDGE_MODULE_MANIFEST);

  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    if (pkg.edgeModule) {
      manifestPath = path.resolve(moduleRoot, pkg.edgeModule);
    }
  }

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  let manifest;
  if (manifestPath.endsWith(".json")) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } else if (manifestPath.endsWith(".js") || manifestPath.endsWith(".cjs")) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const loaded = require(manifestPath);
    manifest =
      loaded?.edgeModuleManifest || loaded?.manifest || loaded?.default || loaded;
  } else {
    throw new Error(`Unsupported manifest format: ${manifestPath}`);
  }

  const errors = validateManifest(manifest);
  if (errors.length) {
    throw new Error(
      `Invalid manifest at ${manifestPath}:\n- ${errors.join("\n- ")}`
    );
  }

  return { manifest, manifestPath };
}

function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    errors.push("Manifest must be an object.");
    return errors;
  }
  if (!manifest.id || typeof manifest.id !== "string") {
    errors.push("Manifest.id must be a non-empty string.");
  }
  if (!manifest.version || typeof manifest.version !== "string") {
    errors.push("Manifest.version must be a non-empty string.");
  }
  if (
    manifest.dependencies &&
    !Array.isArray(manifest.dependencies) &&
    typeof manifest.dependencies !== "object"
  ) {
    errors.push(
      "Manifest.dependencies must be an array of dependencies or an object with dependencies/devDependencies."
    );
  }
  if (manifest.templates && !Array.isArray(manifest.templates)) {
    errors.push("Manifest.templates must be an array.");
  }
  if (manifest.files && !Array.isArray(manifest.files)) {
    errors.push("Manifest.files must be an array.");
  }
  if (manifest.patches && !Array.isArray(manifest.patches)) {
    errors.push("Manifest.patches must be an array.");
  }
  if (manifest.runtime) {
    if (!manifest.runtime.entry || typeof manifest.runtime.entry !== "string") {
      errors.push("Manifest.runtime.entry must be a non-empty string.");
    }
    if (!manifest.runtime.target || typeof manifest.runtime.target !== "string") {
      errors.push("Manifest.runtime.target must be a non-empty string.");
    }
    if (
      manifest.runtime.export &&
      typeof manifest.runtime.export !== "string"
    ) {
      errors.push("Manifest.runtime.export must be a string.");
    }
  }
  return errors;
}

function discoverModulePackages(workspaceRoot) {
  const globs = readWorkspaceGlobs(workspaceRoot);
  const dirs = expandPackageDirs(workspaceRoot, globs);
  const results = [];

  for (const dir of dirs) {
    const loaded = loadModuleManifest(dir);
    if (loaded?.manifest) {
      results.push({
        manifest: loaded.manifest,
        manifestPath: loaded.manifestPath,
        moduleRoot: dir,
      });
    }
  }

  return results;
}

function resolveModuleById(workspaceRoot, moduleId) {
  const modules = discoverModulePackages(workspaceRoot);
  return modules.find((entry) => entry.manifest.id === moduleId) || null;
}

function normalizeDependencies(dependencies) {
  const normalized = { dependencies: [], devDependencies: [] };
  if (!dependencies) {
    return normalized;
  }

  if (Array.isArray(dependencies)) {
    for (const dep of dependencies) {
      if (typeof dep === "string") {
        normalized.dependencies.push(dep);
        continue;
      }
      if (!dep || typeof dep !== "object" || !dep.name) {
        continue;
      }
      const spec = dep.version ? `${dep.name}@${dep.version}` : dep.name;
      if (dep.dev) {
        normalized.devDependencies.push(spec);
      } else {
        normalized.dependencies.push(spec);
      }
    }
    return normalized;
  }

  if (dependencies.dependencies) {
    for (const [name, version] of Object.entries(
      dependencies.dependencies || {}
    )) {
      normalized.dependencies.push(version ? `${name}@${version}` : name);
    }
  }

  if (dependencies.devDependencies) {
    for (const [name, version] of Object.entries(
      dependencies.devDependencies || {}
    )) {
      normalized.devDependencies.push(version ? `${name}@${version}` : name);
    }
  }

  return normalized;
}

function runPnpmInstall(projectRoot, args) {
  const result = spawnSync("pnpm", args, {
    cwd: projectRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} failed.`);
  }
}

async function installDependencies(projectRoot, dependencies) {
  const normalized = normalizeDependencies(dependencies);
  const actions = { dependencies: [], devDependencies: [] };

  if (normalized.dependencies.length) {
    runPnpmInstall(projectRoot, ["add", ...normalized.dependencies]);
    actions.dependencies = normalized.dependencies;
  }

  if (normalized.devDependencies.length) {
    runPnpmInstall(projectRoot, ["add", "-D", ...normalized.devDependencies]);
    actions.devDependencies = normalized.devDependencies;
  }

  return actions;
}

async function copyTemplates(moduleRoot, projectRoot, templates = []) {
  const results = [];
  for (const template of templates) {
    if (!template || !template.from || !template.to) {
      continue;
    }
    const sourcePath = path.resolve(moduleRoot, template.from);
    const targetPath = path.resolve(projectRoot, template.to);
    const outcome = await copyRecursive(
      sourcePath,
      targetPath,
      Boolean(template.overwrite)
    );
    results.push({
      from: template.from,
      to: template.to,
      status: outcome.status,
    });
  }
  return results;
}

async function copyRecursive(sourcePath, targetPath, overwrite) {
  const stats = await fsp.stat(sourcePath);
  if (stats.isDirectory()) {
    await ensureDir(targetPath);
    const entries = await fsp.readdir(sourcePath);
    for (const entry of entries) {
      await copyRecursive(
        path.join(sourcePath, entry),
        path.join(targetPath, entry),
        overwrite
      );
    }
    return { status: "copied" };
  }

  if (fs.existsSync(targetPath) && !overwrite) {
    return { status: "skipped" };
  }

  const existed = fs.existsSync(targetPath);
  await ensureDir(path.dirname(targetPath));
  await fsp.copyFile(sourcePath, targetPath);
  return { status: existed && overwrite ? "overwritten" : "copied" };
}

async function applyPatches(moduleRoot, projectRoot, patches = []) {
  const results = [];
  for (const patch of patches) {
    if (!patch || !patch.type || !patch.target) {
      continue;
    }
    if (patch.type === "json-merge") {
      const result = await applyJsonMergePatch(projectRoot, patch);
      results.push({ type: patch.type, target: patch.target, status: result });
    } else if (patch.type === "marker-insert") {
      const result = await applyMarkerInsertPatch(moduleRoot, projectRoot, patch);
      results.push({ type: patch.type, target: patch.target, status: result });
    } else {
      throw new Error(`Unknown patch type: ${patch.type}`);
    }
  }
  return results;
}

async function applyJsonMergePatch(projectRoot, patch) {
  const targetPath = resolveAbsolutePath(projectRoot, patch.target);
  const createIfMissing = Boolean(patch.createIfMissing);
  let current = {};
  let status = "updated";

  if (fs.existsSync(targetPath)) {
    const raw = await fsp.readFile(targetPath, "utf8");
    current = raw.trim() ? JSON.parse(raw) : {};
  } else if (!createIfMissing) {
    throw new Error(`JSON merge target missing: ${patch.target}`);
  } else {
    status = "created";
  }

  const merged = deepMerge(current, patch.merge || {});
  const sorted = stableSortObject(merged);
  await ensureDir(path.dirname(targetPath));
  await fsp.writeFile(targetPath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  return status;
}

async function applyMarkerInsertPatch(moduleRoot, projectRoot, patch) {
  const targetPath = resolveAbsolutePath(projectRoot, patch.target);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Marker insert target missing: ${patch.target}`);
  }

  if (!patch.marker && (!patch.startMarker || !patch.endMarker)) {
    throw new Error(
      `Marker insert patch missing marker or start/end markers for ${patch.target}`
    );
  }

  let insertContent = patch.content;
  if (!insertContent && patch.source) {
    const sourcePath = path.resolve(moduleRoot, patch.source);
    insertContent = await fsp.readFile(sourcePath, "utf8");
  }
  if (!insertContent) {
    throw new Error(`Marker insert content missing for ${patch.target}`);
  }

  const markerLabel = patch.marker;
  const startMarker =
    patch.startMarker || `// EDGE MODULE ${markerLabel} START`;
  const endMarker = patch.endMarker || `// EDGE MODULE ${markerLabel} END`;

  const fileContent = await fsp.readFile(targetPath, "utf8");
  const lines = fileContent.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.includes(startMarker));
  const endIndex = lines.findIndex(
    (line, idx) => idx > startIndex && line.includes(endMarker)
  );

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `Markers not found in ${patch.target}: ${startMarker} / ${endMarker}`
    );
  }

  const normalizedInsert = insertContent.trim();
  const between = lines.slice(startIndex + 1, endIndex).join("\n");
  if (between.includes(normalizedInsert)) {
    return "skipped";
  }

  const insertLines = insertContent.replace(/\s+$/, "").split(/\r?\n/);
  const insertPosition = patch.insertPosition === "before" ? startIndex + 1 : endIndex;
  lines.splice(insertPosition, 0, ...insertLines);

  const hadTrailingNewline = fileContent.endsWith("\n");
  const nextContent = lines.join("\n") + (hadTrailingNewline ? "\n" : "");
  await fsp.writeFile(targetPath, nextContent, "utf8");
  return "inserted";
}

function deepMerge(target, source) {
  if (Array.isArray(source)) {
    return source.slice();
  }
  if (source && typeof source === "object") {
    const result = Array.isArray(target) ? [] : { ...target };
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = deepMerge(target?.[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return source;
}

function stableSortObject(value) {
  if (Array.isArray(value)) {
    return value.map(stableSortObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

async function writeReceipt(projectRoot, moduleId, receiptPath, data) {
  const targetPath = resolveAbsolutePath(projectRoot, receiptPath);
  await ensureDir(path.dirname(targetPath));
  const sorted = stableSortObject(data);
  await fsp.writeFile(targetPath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  return targetPath;
}

function loadReceipts(projectRoot) {
  const receiptsDir = path.join(projectRoot, EDGE_MODULES_DIR);
  if (!fs.existsSync(receiptsDir)) {
    return [];
  }
  return fs
    .readdirSync(receiptsDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(receiptsDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        return { path: fullPath, data };
      } catch (error) {
        return { path: fullPath, error };
      }
    });
}

async function installModule(projectRoot, workspaceRoot, moduleId) {
  if (!isEdgeProject(projectRoot)) {
    throw new Error(
      `Missing sentinel file ${EDGE_SENTINEL_FILE}. This does not look like an Edge app project.`
    );
  }

  const moduleEntry = resolveModuleById(workspaceRoot, moduleId);
  if (!moduleEntry) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  const { manifest, moduleRoot } = moduleEntry;
  const installAt = new Date().toISOString();

  const deps = await installDependencies(projectRoot, manifest.dependencies);
  const templateList = [
    ...(manifest.templates || []),
    ...(manifest.files || []),
  ];
  if (manifest.runtime?.entry && manifest.runtime?.target) {
    const hasRuntimeTemplate = templateList.some(
      (template) =>
        template?.from === manifest.runtime.entry &&
        template?.to === manifest.runtime.target
    );
    if (!hasRuntimeTemplate) {
      templateList.push({
        from: manifest.runtime.entry,
        to: manifest.runtime.target,
        overwrite: false,
      });
    }
  }
  const templates = await copyTemplates(moduleRoot, projectRoot, templateList);
  const patches = await applyPatches(moduleRoot, projectRoot, manifest.patches);
  const registry = await upsertRegistryEntry(
    projectRoot,
    manifest.id,
    manifest.version
  );
  const runtimeRegistry = await upsertRuntimeRegistryEntry(projectRoot, manifest);

  const receiptPath =
    manifest.receipt?.path || path.join(EDGE_MODULES_DIR, `${manifest.id}.json`);
  const receipt = {
    moduleId: manifest.id,
    version: manifest.version,
    installedAt: installAt,
    manifest,
    actions: {
      dependencies: deps,
      templates,
      patches,
      registry,
      runtimeRegistry,
    },
  };

  const receiptFile = await writeReceipt(
    projectRoot,
    manifest.id,
    receiptPath,
    receipt
  );

  return {
    module: manifest,
    receipt: receiptFile,
    registry: registry.path,
    actions: receipt.actions,
  };
}

function validateProject(projectRoot) {
  const issues = [];
  if (!isEdgeProject(projectRoot)) {
    issues.push({
      level: "error",
      message: `Missing sentinel file ${EDGE_SENTINEL_FILE}.`,
      suggestion: "Create edgeapp.project.json or re-run the edge project initializer.",
    });
  }

  const registryPath = path.join(projectRoot, EDGE_REGISTRY_FILE);
  let registryEntries = {};
  if (!fs.existsSync(registryPath)) {
    issues.push({
      level: "error",
      message: `Registry file missing: ${EDGE_REGISTRY_FILE}.`,
      suggestion: "Run edge module add <moduleId> to recreate the registry.",
    });
  } else {
    try {
      const content = fs.readFileSync(registryPath, "utf8");
      registryEntries = readRegistryEntries(content).entries;
    } catch (error) {
      issues.push({
        level: "error",
        message: `Registry file invalid: ${EDGE_REGISTRY_FILE}.`,
        suggestion:
          "Restore the registry markers or re-run edge module add for installed modules.",
      });
    }
  }

  const runtimeRegistryPath = path.join(projectRoot, EDGE_RUNTIME_REGISTRY_FILE);
  if (!fs.existsSync(runtimeRegistryPath)) {
    issues.push({
      level: "warn",
      message: `Runtime registry file missing: ${EDGE_RUNTIME_REGISTRY_FILE}.`,
      suggestion:
        "Re-install a module or add edge-modules/registry.ts to the project.",
    });
  }

  const receipts = loadReceipts(projectRoot);
  const receiptById = {};
  for (const receipt of receipts) {
    if (receipt.error) {
      issues.push({
        level: "error",
        message: `Receipt is unreadable: ${path.basename(receipt.path)}.`,
        suggestion: "Delete the bad receipt and re-install the module.",
      });
      continue;
    }
    const moduleId = receipt.data?.moduleId;
    if (!moduleId) {
      issues.push({
        level: "error",
        message: `Receipt missing moduleId: ${path.basename(receipt.path)}.`,
        suggestion: "Delete the receipt and re-install the module.",
      });
      continue;
    }
    receiptById[moduleId] = receipt.data;
  }

  for (const [moduleId, version] of Object.entries(registryEntries)) {
    if (!receiptById[moduleId]) {
      issues.push({
        level: "error",
        message: `Registry entry missing receipt: ${moduleId}.`,
        suggestion: "Re-install the module or remove the registry entry.",
      });
      continue;
    }
    if (receiptById[moduleId].version !== version) {
      issues.push({
        level: "warn",
        message: `Registry version mismatch for ${moduleId}.`,
        suggestion: "Re-install the module to sync versions.",
      });
    }
  }

  for (const moduleId of Object.keys(receiptById)) {
    if (!registryEntries[moduleId]) {
      issues.push({
        level: "warn",
        message: `Receipt missing registry entry: ${moduleId}.`,
        suggestion: "Run edge module add <moduleId> to restore the registry.",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

function doctorProject(projectRoot) {
  const validation = validateProject(projectRoot);
  if (validation.ok) {
    return { ok: true, issues: [] };
  }
  return validation;
}

module.exports = {
  EDGE_SENTINEL_FILE,
  EDGE_MODULES_DIR,
  EDGE_REGISTRY_FILE,
  EDGE_REGISTRY_MARKER,
  getWorkspaceRoot,
  discoverModulePackages,
  resolveModuleById,
  installModule,
  createModulePackage,
  loadReceipts,
  isEdgeProject,
  validateProject,
  doctorProject,
};
