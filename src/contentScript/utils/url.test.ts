import { isURLCanParse } from "./url"

test('URL.canParse util', () => {
    expect(isURLCanParse('/status/123')).toBeFalsy()
    expect(isURLCanParse('https://www.google.com')).toBeTruthy()
})