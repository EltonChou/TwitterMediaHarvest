import { getEnv } from '#utils/env'
import { makeApiUrl } from './clientApiUrl'

describe('unit test for api url helper', () => {
  const apiHost = getEnv('API_HOSTNAME')

  beforeAll(() => (process.env.API_HOSTNAME = apiHost))
  afterAll(() => delete process.env.API_HOSTNAME)

  it('can make api url', () => {
    const url = makeApiUrl('/v1/endpoint')
    const urlWithQuery = makeApiUrl('/v1/endpoint', { key: 1, param: 'param' })

    expect(url.href).toMatch(apiHost + '/v1/endpoint')
    expect(urlWithQuery.href).toMatch(apiHost + '/v1/endpoint?key=1&param=param')
  })

  it('can throw when invalid path provided', () => {
    const shouldThrowError = () => makeApiUrl('some')
    expect(shouldThrowError).toThrow(/^path should/)
  })
})
