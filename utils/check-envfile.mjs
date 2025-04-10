#!/usr/bin/env node
import {
  extractEnvFromWebpackConfig,
  extractJSEnvVars,
  parseDevEnv,
} from './envVarExtractor.mjs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

async function checkEnvFile(envFile) {
  if (!envFile) {
    throw new Error('No environment file specified')
  }

  const envFilePath = path.join(projectRoot, envFile)
  try {
    await fs.access(envFilePath)
  } catch (_error) {
    throw new Error(`Environment file ${envFile} does not exist`)
  }

  try {
    // Get env vars from JS/TS files
    const jsEnvVars = new Set(
      await extractJSEnvVars(path.join(projectRoot, 'src'))
    )

    // Get env vars from webpack config
    const webpackEnvVars = new Set(
      await extractEnvFromWebpackConfig(
        path.join(projectRoot, 'webpack.common.config.mjs')
      )
    )

    // Get env vars from .env file

    const envFileVars = new Set(
      await parseDevEnv(path.join(projectRoot, envFile))
    )

    // Find vars that are used in code but not in webpack config
    const requiredEnvVars = new Set(
      [...jsEnvVars].filter(v => !webpackEnvVars.has(v))
    )

    // Check which required vars are missing from .env file
    const missingVars = [...requiredEnvVars].filter(v => !envFileVars.has(v))

    console.log('\nEnvironment Variables Check')
    console.log('=========================')
    console.log(`Total variables used in code: ${jsEnvVars.size}`)
    console.log(`Variables managed by Webpack: ${webpackEnvVars.size}`)
    console.log(`Variables defined in .env: ${envFileVars.size}`)

    if (missingVars.length > 0) {
      console.error('\n❌ Missing environment variables in .env file:')
      missingVars.forEach(v => console.error(`   - ${v}`))
      process.exit(1)
    } else {
      console.log('\n✅ All required environment variables are defined')
      process.exit(0)
    }
  } catch (error) {
    console.error('Error checking environment variables:', error)
    process.exit(1)
  }
}

// Execute if running directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const envFile = process.argv[2] || '.env'
  checkEnvFile(envFile)
}
