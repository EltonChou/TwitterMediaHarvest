/**
 * Equals to `URL.canParse`
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/canParse_static
 */
export const isURLCanParse = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}
