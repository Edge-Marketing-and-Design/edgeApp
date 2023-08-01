#!/usr/bin/env node
console.log('Script started')
const { execSync } = require('child_process')

const runCommand = (command) => {
  try {
    console.log(`Running command: ${command}`)
    execSync(`${command}`, { stdio: 'inherit' })
  }
  catch (err) {
    console.error(`Failed to run command: ${command}`, err)
    return false
  }
  return true
}

const repoName = process.argv[2]
const gitCheckoutCommand = `git clone --depth 1 https://github.com/Edge-Marketing-and-Design/edgeApp.git ${repoName}`
const installDependenciesCommand = `cd ${repoName} && pnpm install`
const installFunctionDependenciesCommand = `cd ${repoName}/functions && npm install`

console.log(`Cloning with name ${repoName}...`)
const checkedOut = runCommand(gitCheckoutCommand)
if (!checkedOut) {
  process.exit(1)
}

console.log(`Installing dependencies for ${repoName}...`)
const installedDeps = runCommand(installDependenciesCommand)
if (!installedDeps) {
  process.exit(1)
}

console.log(`Installing function dependencies for ${repoName}...`)
const installedFunctionDeps = runCommand(installFunctionDependenciesCommand)
if (!installedFunctionDeps) {
  process.exit(1)
}

console.log(`Successfully created ${repoName}!`)
console.log(`cd into ${repoName} and run 'sh firebase_init.sh' to initialize your firebase project.`)
