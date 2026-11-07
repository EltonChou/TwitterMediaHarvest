/**
 * @jest-environment jsdom
 */

const TRACKED_URL =
  'https://api.x.com/graphql/aFq0sIZGLPFhDrTzq51DRg/UserOriginalsTimeline?variables=%7B%7D'
const TRACKED_PATH = '/graphql/aFq0sIZGLPFhDrTzq51DRg/UserOriginalsTimeline'

const makeResponse = (status: number, body: string) =>
  ({ status, clone: () => ({ text: async () => body }) }) as unknown as Response

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

describe('fetch response capturing', () => {
  const originalFetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>()
  const listener = jest.fn<
    void,
    [CustomEvent<MediaHarvest.MediaResponseDetail>]
  >()

  beforeAll(async () => {
    window.fetch = originalFetch
    await import('./injectFetch')
    document.addEventListener('mh:media-response', listener)
  })

  afterEach(() => jest.resetAllMocks())

  it.each([
    { inputType: 'string', input: TRACKED_URL },
    { inputType: 'URL', input: new URL(TRACKED_URL) },
    { inputType: 'Request', input: { url: TRACKED_URL } as Request },
  ])(
    'should dispatch the body of a tracked 200 response ($inputType input)',
    async ({ input }) => {
      const response = makeResponse(200, '{"data":{}}')
      originalFetch.mockResolvedValue(response)

      await expect(fetch(input)).resolves.toBe(response)
      await flushPromises()

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener.mock.calls[0][0].detail).toEqual({
        path: TRACKED_PATH,
        status: 200,
        body: '{"data":{}}',
      })
    }
  )

  it.each([
    {
      reason: 'untracked path',
      url: 'https://api.x.com/graphql/a/Viewer',
      status: 200,
    },
    { reason: 'non-200 status', url: TRACKED_URL, status: 429 },
  ])('should not dispatch for $reason', async ({ url, status }) => {
    originalFetch.mockResolvedValue(makeResponse(status, '{}'))

    await fetch(url)
    await flushPromises()

    expect(listener).not.toHaveBeenCalled()
  })

  it('should pass a rejected fetch through unchanged', async () => {
    const error = new TypeError('Failed to fetch')
    originalFetch.mockRejectedValue(error)

    await expect(fetch(TRACKED_URL)).rejects.toBe(error)
    await flushPromises()

    expect(listener).not.toHaveBeenCalled()
  })
})
