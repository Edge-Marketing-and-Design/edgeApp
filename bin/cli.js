#!/usr/bin/env node
console.log('Script started')
const { execSync } = require('child_process')
// const fs = require('fs')
// const readline = require('readline')

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

// const promptForProjectId = () => {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   })

//   return new Promise((resolve, reject) => {
//     rl.question('Please enter your Firebase project ID: ', (projectId) => {
//       rl.close()
//       resolve(projectId)
//     })
//   })
// }

// const initializeFirebase = async (projectId, repoName) => {
//   if (!projectId) {
//     console.error('Error: Firebase project ID cannot be empty.')
//     process.exit(1)
//   }

//   try {
//     execSync('firebase --version', { stdio: 'inherit' })
//   }
//   catch (err) {
//     console.error('Firebase CLI could not be found. Please install it and try again.')
//     process.exit(1)
//   }

//   const pathToFirebaseJson = `${repoName}/firebase.json`
//   const pathToFirestoreRules = `${repoName}/firestore.rules`

//   if (fs.existsSync(pathToFirebaseJson)) {
//     fs.renameSync(pathToFirebaseJson, `${pathToFirebaseJson}.temp`)
//   }

//   if (fs.existsSync(pathToFirestoreRules)) {
//     fs.renameSync(pathToFirestoreRules, `${pathToFirestoreRules}.temp`)
//   }

//   console.log(`Initializing Firebase for ${repoName}...`)
//   runCommand(`cd ${repoName} && firebase use --add ${projectId} --alias default`)
//   runCommand(`cd ${repoName} && firebase init firestore functions hosting storage emulators --project default`)

//   if (fs.existsSync(`${pathToFirebaseJson}.temp`)) {
//     fs.renameSync(`${pathToFirebaseJson}.temp`, pathToFirebaseJson)
//   }

//   if (fs.existsSync(`${pathToFirestoreRules}.temp`)) {
//     fs.renameSync(`${pathToFirestoreRules}.temp`, pathToFirestoreRules)
//   }
// }

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

// const main = async () => {
//   const projectId = await promptForProjectId()
//   await initializeFirebase(projectId, repoName)
// }

// main()
