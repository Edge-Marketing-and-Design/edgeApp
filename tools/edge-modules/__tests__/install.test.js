const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const moduleSystem = require('../module-system')

const repoRoot = path.resolve(__dirname, '..', '..', '..')

test('installs a module into a target project', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-module-test-'))
  fs.writeFileSync(
    path.join(tempDir, 'edgeapp.project.json'),
    JSON.stringify({ project: 'edge-app', platformVersion: '1.0.0' }),
  )

  await moduleSystem.installModule(tempDir, repoRoot, 'test-module')

  assert.ok(fs.existsSync(path.join(tempDir, '.edge', 'modules', 'registry.ts')))
  assert.ok(
    fs.existsSync(path.join(tempDir, '.edge', 'modules', 'test-module.json')),
  )
  assert.ok(
    fs.existsSync(path.join(tempDir, 'edge-modules', 'registry.ts')),
  )
  assert.ok(
    fs.existsSync(path.join(tempDir, 'edge-modules', 'test-module.ts')),
  )
  assert.ok(
    fs.existsSync(path.join(tempDir, 'edge-modules', 'pep-talk.ts')),
  )
  assert.ok(
    fs.existsSync(path.join(tempDir, 'plugins', 'test-module.client.ts')),
  )

  const runtimeRegistry = fs.readFileSync(
    path.join(tempDir, 'edge-modules', 'registry.ts'),
    'utf8',
  )
  assert.ok(runtimeRegistry.includes("import { edgeModule as testModule }"))
  assert.ok(runtimeRegistry.includes('"test-module": testModule'))
})
