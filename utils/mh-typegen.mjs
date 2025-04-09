#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'
import ts from 'typescript'

function extractEnvFromPluginConfig(node) {
  const envVars = new Set()
  if (
    ts.isNewExpression(node) &&
    node.expression.getText() === 'EnvironmentPlugin' &&
    node.arguments.length > 0
  ) {
    const arg = node.arguments[0]
    if (ts.isObjectLiteralExpression(arg)) {
      arg.properties.forEach(prop => {
        if (ts.isPropertyAssignment(prop) && prop.name) {
          envVars.add(prop.name.getText())
        }
      })
    }
  }
  return Array.from(envVars)
}

async function extractEnvFromWebpackConfig(configPath) {
  const content = await fs.readFile(configPath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    configPath,
    content,
    ts.ScriptTarget.Latest,
    true
  )

  const envVars = new Set()

  function visit(node) {
    // Check for new EnvironmentPlugin() usage
    const vars = extractEnvFromPluginConfig(node)
    vars.forEach(v => envVars.add(v))

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return Array.from(envVars)
}

async function parseDevEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    return lines
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(Boolean)
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}:`, error.message)
    return []
  }
}

async function main() {
  const devEnvPath = path.join(process.cwd(), 'sample.env')
  const webpackConfigPath = path.join(
    process.cwd(),
    'webpack.common.config.mjs'
  )

  const [devEnvVars, webpackEnvVars] = await Promise.all([
    parseDevEnv(devEnvPath),
    extractEnvFromWebpackConfig(webpackConfigPath),
  ])

  const envVars = Array.from(new Set([...webpackEnvVars, ...devEnvVars]))

  console.log(
    'Runtime environment variables:',
    Array.from(new Set([...webpackEnvVars, ...devEnvVars]))
  )

  await generateTypeDefinition(envVars)
}

async function generateTypeDefinition(envVars) {
  const content = `declare namespace MediaHarvest {
  interface Env {
    ${envVars.map(key => `${key}: string`).join('\n    ')}
  }
}

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends MediaHarvest.Env {}
}
`

  const targetPath = path.join(process.cwd(), 'src', 'runtime.d.ts')
  await fs.writeFile(targetPath, content, 'utf-8')
  console.log('Generated type definition file: ' + targetPath)
}

main().catch(console.error)
