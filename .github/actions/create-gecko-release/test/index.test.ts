import { postJson, validateInputs } from '../src/index.ts'
import assert from 'node:assert/strict'
import * as http from 'node:http'
import { describe, it } from 'node:test'

const validInputs = {
  endpoint: 'https://example.com/release',
  id: 'mediaharvest@foo.bar',
  version: '1.2.3',
  url: 'https://example.com/extension.xpi',
  apiKey: 'secret',
}

describe('validateInputs', () => {
  it('accepts valid inputs', () => {
    assert.doesNotThrow(() => validateInputs(validInputs))
  })

  it('accepts valid inputs with minBrowserVersion', () => {
    assert.doesNotThrow(() =>
      validateInputs({ ...validInputs, minBrowserVersion: '111.0' })
    )
  })

  it('throws when endpoint is empty', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, endpoint: '' }),
      /endpoint is required/
    )
  })

  it('throws when endpoint is not a valid URL', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, endpoint: 'not-a-url' }),
      /endpoint is not a valid URL/
    )
  })

  it('throws when id is empty', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, id: '' }),
      /id is required/
    )
  })

  it('throws when version is empty', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, version: '' }),
      /version is not a valid semver/
    )
  })

  it('throws when version is not valid semver', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, version: 'not-semver' }),
      /version is not a valid semver/
    )
  })

  it('throws when url is empty', () => {
    assert.throws(
      () => validateInputs({ ...validInputs, url: '' }),
      /url is required/
    )
  })

  it('throws when minBrowserVersion is not valid semver', () => {
    assert.throws(
      () =>
        validateInputs({ ...validInputs, minBrowserVersion: 'not-a-version' }),
      /min-browser-version is not a valid semver/
    )
  })
})

describe('postJson', () => {
  async function withServer(
    handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
    fn: (url: string) => Promise<void>
  ) {
    const server = http.createServer(handler)
    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as { port: number }).port
    try {
      await fn(`http://localhost:${port}`)
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve()))
      )
    }
  }

  it('sends POST with correct headers and body', async () => {
    const payload = { id: 'test', version: '1.0.0', url: 'https://x.com' }

    await withServer(
      (req, res) => {
        let body = ''
        req.on('data', chunk => (body += chunk))
        req.on('end', () => {
          assert.equal(req.method, 'POST')
          assert.equal(req.headers['content-type'], 'application/json')
          assert.equal(req.headers['x-api-key'], 'mykey')
          assert.deepEqual(JSON.parse(body), payload)
          res.writeHead(200)
          res.end('{"ok":true}')
        })
      },
      async url => {
        const result = await postJson(url, payload, 'mykey')
        assert.equal(result.statusCode, 200)
        assert.equal(result.body, '{"ok":true}')
      }
    )
  })

  it('returns non-2xx status code from server', async () => {
    await withServer(
      (_req, res) => {
        res.writeHead(400)
        res.end('bad request')
      },
      async url => {
        const result = await postJson(url, {}, 'key')
        assert.equal(result.statusCode, 400)
        assert.equal(result.body, 'bad request')
      }
    )
  })

  it('rejects on network error', async () => {
    await assert.rejects(() => postJson('http://localhost:1', {}, 'key'))
  })
})
