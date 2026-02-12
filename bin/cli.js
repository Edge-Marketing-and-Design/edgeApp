#!/usr/bin/env node
console.log('Script started')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

const modifyPackageJson = (repoName) => {
  try {
    const packageJsonPath = path.join(repoName, 'package.json')
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf-8')
    const packageJsonObj = JSON.parse(packageJsonData)

    // Modify the properties
    delete packageJsonObj.version
    delete packageJsonObj.bin
    packageJsonObj.name = repoName
    packageJsonObj.description = `A really cool Edge App for ${repoName}`

    // Write the file back
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonObj, null, 2))
  }
  catch (err) {
    console.error('Failed to modify package.json', err)
    return false
  }
  return true
}

const cleanGitignore = (repoName) => {
  try {
    const gitignorePath = path.join(repoName, '.gitignore')
    const gitignoreData = fs.readFileSync(gitignorePath, 'utf-8')
    const lines = gitignoreData.split('\n')

    const markerIndex = lines.findIndex(line => line.trim() === '# Remove these after install:')
    if (markerIndex !== -1) {
      const cleanedLines = lines.slice(0, markerIndex)
      fs.writeFileSync(gitignorePath, cleanedLines.join('\n'))
      console.log('.gitignore cleaned successfully')
    }
    else {
      console.log('No cleanup marker found in .gitignore')
    }
  }
  catch (err) {
    console.error('Failed to clean .gitignore', err)
    return false
  }
  return true
}

const repoName = process.argv[2]

const gitCheckoutCommand = `git clone https://github.com/Edge-Marketing-and-Design/edgeApp.git ${repoName}`
const removeOriginRemoteCommand = `cd ${repoName} && git remote remove origin`
const addEdgeComponentsRemoteCommand = `cd ${repoName} && git remote add edge-vue-components https://github.com/Edge-Marketing-and-Design/edge-vue-components.git`
const installDependenciesCommand = `cd ${repoName} && pnpm store prune && pnpm install --force --ignore-scripts=false`
const installFunctionDependenciesCommand = `cd ${repoName}/functions && npm install`
// const cloneFirebaseFrameworkCommand = `cd ${repoName} && git clone https://github.com/Edge-Marketing-and-Design/edge-vue-components.git edge`

console.log(`Cloning with name ${repoName}...`)
const checkedOut = runCommand(gitCheckoutCommand)
if (!checkedOut) {
  process.exit(1)
}

console.log(`Detaching template origin remote from ${repoName}...`)
const removedOriginRemote = runCommand(removeOriginRemoteCommand)
if (!removedOriginRemote) {
  process.exit(1)
}

console.log(`Adding edge-vue-components remote to ${repoName}...`)
const addedEdgeComponentsRemote = runCommand(addEdgeComponentsRemoteCommand)
if (!addedEdgeComponentsRemote) {
  process.exit(1)
}

console.log(`Modifying package.json for ${repoName}...`)
const modifiedPackageJson = modifyPackageJson(repoName)
if (!modifiedPackageJson) {
  process.exit(1)
}

console.log(`Cleaning .gitignore for ${repoName}...`)
const cleanedGitignore = cleanGitignore(repoName)
if (!cleanedGitignore) {
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

// console.log(`Cloning Firebase Framework inside ${repoName}...`)
// const clonedFirebaseFramework = runCommand(cloneFirebaseFrameworkCommand)
// if (!clonedFirebaseFramework) {
//   process.exit(1)
// }

console.log(`Successfully created ${repoName}!`)
console.log(`Add your own git origin with: cd ${repoName} && git remote add origin <your-repo-url>`)
console.log(`cd into ${repoName} and run 'sh firebase_init.sh' to initialize your firebase project.`)
