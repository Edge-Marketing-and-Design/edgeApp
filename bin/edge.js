#!/usr/bin/env node
"use strict";

const path = require("path");
const moduleSystem = require("../tools/edge-modules/module-system");

function parseArgs(rawArgs) {
  const args = [];
  let projectRoot;
  let workspaceRoot;

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === "--project-root" || arg === "--root") {
      projectRoot = rawArgs[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--project-root=")) {
      projectRoot = arg.split("=")[1];
      continue;
    }
    if (arg === "--workspace-root") {
      workspaceRoot = rawArgs[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--workspace-root=")) {
      workspaceRoot = arg.split("=")[1];
      continue;
    }
    args.push(arg);
  }

  return { args, projectRoot, workspaceRoot };
}

function printHelp() {
  console.log("edge module <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  list                 List available and installed modules");
  console.log("  add <moduleId>        Install a module into the current project");
  console.log("  upgrade <moduleId>    Re-install a module to apply updates");
  console.log("  info <moduleId>       Show module manifest details");
  console.log("  validate              Validate module registry and receipts");
  console.log("  doctor                Troubleshoot module installation");
  console.log("");
  console.log("Options:");
  console.log("  --project-root <dir>  Target project root (defaults to CWD)");
  console.log("  --workspace-root <dir>  Override module workspace root");
}

function formatDependencySummary(manifest) {
  if (!manifest.dependencies) {
    return "none";
  }
  if (Array.isArray(manifest.dependencies)) {
    return `${manifest.dependencies.length} deps`;
  }
  const depCount = Object.keys(manifest.dependencies.dependencies || {}).length;
  const devCount = Object.keys(manifest.dependencies.devDependencies || {}).length;
  return `${depCount} deps, ${devCount} dev deps`;
}

async function listModules(projectRoot, workspaceRoot) {
  const available = moduleSystem.discoverModulePackages(workspaceRoot);
  const receipts = moduleSystem.loadReceipts(projectRoot);
  const installed = receipts
    .filter((receipt) => receipt.data && receipt.data.moduleId)
    .map((receipt) => receipt.data);

  if (!moduleSystem.isEdgeProject(projectRoot)) {
    console.log(
      `Note: ${moduleSystem.EDGE_SENTINEL_FILE} not found in ${projectRoot}. Installed modules may be incomplete.`
    );
    console.log("");
  }

  console.log("Available modules:");
  if (!available.length) {
    console.log("- (none found)");
  } else {
    for (const entry of available) {
      const desc = entry.manifest.description
        ? ` - ${entry.manifest.description}`
        : "";
      console.log(`- ${entry.manifest.id}@${entry.manifest.version}${desc}`);
    }
  }

  console.log("");
  console.log("Installed modules:");
  if (!installed.length) {
    console.log("- (none installed)");
  } else {
    for (const receipt of installed) {
      console.log(`- ${receipt.moduleId}@${receipt.version}`);
    }
  }
}

async function showModuleInfo(moduleId, projectRoot, workspaceRoot) {
  const entry = moduleSystem.resolveModuleById(workspaceRoot, moduleId);
  if (!entry) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  const manifest = entry.manifest;
  const receipts = moduleSystem.loadReceipts(projectRoot);
  const installed = receipts.find(
    (receipt) => receipt.data?.moduleId === manifest.id
  );

  console.log(`Module: ${manifest.id}`);
  console.log(`Version: ${manifest.version}`);
  console.log(`Description: ${manifest.description || "(none)"}`);
  console.log(`Dependencies: ${formatDependencySummary(manifest)}`);
  console.log(
    `Templates: ${(manifest.templates?.length || 0) + (manifest.files?.length || 0)}`
  );
  console.log(`Patches: ${manifest.patches?.length || 0}`);
  console.log(
    `Installed: ${installed ? `yes (${installed.data.version})` : "no"}`
  );
}

function printIssues(result) {
  if (!result.issues.length) {
    console.log("No issues found.");
    return;
  }
  for (const issue of result.issues) {
    const label = issue.level === "warn" ? "WARN" : "ERROR";
    console.log(`[${label}] ${issue.message}`);
    if (issue.suggestion) {
      console.log(`       ${issue.suggestion}`);
    }
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { args, projectRoot: rawProjectRoot, workspaceRoot: rawWorkspaceRoot } =
    parseArgs(rawArgs);
  const projectRoot = path.resolve(
    rawProjectRoot || process.env.EDGE_TARGET_PROJECT_ROOT || process.cwd()
  );
  const workspaceRoot = moduleSystem.getWorkspaceRoot(
    projectRoot,
    rawWorkspaceRoot
  );

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  if (args[0] !== "module") {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const command = args[1];
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "list") {
    await listModules(projectRoot, workspaceRoot);
    return;
  }

  if (command === "info") {
    const moduleId = args[2];
    if (!moduleId) {
      throw new Error("Missing moduleId. Usage: edge module info <moduleId>");
    }
    await showModuleInfo(moduleId, projectRoot, workspaceRoot);
    return;
  }

  if (command === "add") {
    const moduleId = args[2];
    if (!moduleId) {
      throw new Error("Missing moduleId. Usage: edge module add <moduleId>");
    }
    const result = await moduleSystem.installModule(
      projectRoot,
      workspaceRoot,
      moduleId
    );
    console.log(
      `Installed ${result.module.id}@${result.module.version} into ${projectRoot}`
    );
    console.log(`Receipt: ${result.receipt}`);
    console.log(`Registry: ${result.registry}`);
    return;
  }

  if (command === "upgrade") {
    const moduleId = args[2];
    if (!moduleId) {
      throw new Error(
        "Missing moduleId. Usage: edge module upgrade <moduleId>"
      );
    }
    const result = await moduleSystem.installModule(
      projectRoot,
      workspaceRoot,
      moduleId
    );
    console.log(
      `Upgraded ${result.module.id}@${result.module.version} in ${projectRoot}`
    );
    console.log(`Receipt: ${result.receipt}`);
    console.log(`Registry: ${result.registry}`);
    return;
  }

  if (command === "validate") {
    const result = moduleSystem.validateProject(projectRoot);
    printIssues(result);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  if (command === "doctor") {
    const result = moduleSystem.doctorProject(projectRoot);
    printIssues(result);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }

  printHelp();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
