import * as core from '@actions/core'
import * as http from 'http'
import * as https from 'https'
import semver from 'semver'

type Inputs = {
  endpoint: string
  id: string
  version: string
  url: string
  minBrowserVersion?: string
  apiKey: string
}

type ReleaseBrowserSpec = { min_version?: string }
type CreateReleaseBody = {
  id: string
  version: string
  url: string
  browser?: ReleaseBrowserSpec
}

function getInputs(): Inputs {
  return {
    endpoint: core.getInput('endpoint', {
      required: true,
    }),
    id: core.getInput('id', { required: true }),
    version: core.getInput('version', { required: true }),
    url: core.getInput('url', { required: true }),
    minBrowserVersion:
      core.getInput('min-browser-version', {
        required: false,
      }) || undefined,
    apiKey: core.getInput('api-key', { required: true }),
  }
}

function validateInputs(inputs: Inputs) {
  if (!inputs.endpoint) throw new Error('endpoint is required')

  if (!URL.canParse(inputs.endpoint))
    throw new Error('endpoint is not a valid URL')

  if (!inputs.id) throw new Error('id is required')

  if (!inputs.version || !semver.valid(inputs.version))
    throw new Error('version is not a valid semver')

  if (!inputs.url) throw new Error('url is required')

  if (inputs.minBrowserVersion && !semver.coerce(inputs.minBrowserVersion))
    throw new Error('min-browser-version is not a valid semver')
}

function postJson(
  endpoint: string,
  payload: Record<string, unknown>,
  apiKey: string
): Promise<{ statusCode?: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint)
    const data = JSON.stringify(payload)
    const options: http.RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Api-Key': apiKey,
      },
    }
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(url, options, (res: http.IncomingMessage) => {
      let body = ''
      res.on('data', (chunk: Buffer) => (body += chunk.toString()))
      res.on('end', () => resolve({ statusCode: res.statusCode, body }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function run() {
  try {
    const inputs = getInputs()
    validateInputs(inputs)

    const payload: CreateReleaseBody = {
      id: inputs.id,
      version: inputs.version,
      url: inputs.url,
    }
    if (inputs.minBrowserVersion) {
      payload.browser = { min_version: inputs.minBrowserVersion }
    }

    const res = await postJson(inputs.endpoint, payload, inputs.apiKey)
    if (!res.statusCode || Math.floor(res.statusCode / 100) !== 2) {
      core.setFailed(`Failed to create release: ${res.statusCode}`)
      core.error(res.body)
      return
    }

    core.info('Release created successfully')
    core.setOutput('response', res.body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    core.setFailed(message)
  }
}

run()
