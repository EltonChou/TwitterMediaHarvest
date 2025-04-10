#!/usr/bin/env node
import { extractEnvFromWebpackConfig, parseDevEnv } from './envVarExtractor.mjs'
import fs from 'fs/promises'
import path from 'path'

async function main() {
  const envFilePath = process.argv[2] || path.join(process.cwd(), 'sample.env')
  const webpackConfigPath = path.join(
    process.cwd(),
    'webpack.common.config.mjs'
  )

  const [devEnvVars, webpackEnvVars] = await Promise.all([
    parseDevEnv(envFilePath),
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
