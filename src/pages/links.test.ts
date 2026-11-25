import { withUtm } from './links'

describe('withUtm', () => {
  it.each([
    {
      name: 'url without query',
      url: 'https://ko-fi.com/eltonhy',
      expected:
        'https://ko-fi.com/eltonhy?utm_source=popup&utm_medium=extension&utm_content=support-btn',
    },
    {
      name: 'url with existing query',
      url: 'https://foo.bar/a?x=1',
      expected:
        'https://foo.bar/a?x=1&utm_source=popup&utm_medium=extension&utm_content=support-btn',
    },
    {
      name: 'url with hash',
      url: 'https://foo.bar/a#v1',
      expected:
        'https://foo.bar/a?utm_source=popup&utm_medium=extension&utm_content=support-btn#v1',
    },
  ])('appends utm params to $name', ({ url, expected }) => {
    expect(withUtm(url, 'popup', 'support-btn')).toBe(expected)
  })
})
