export type ObjectUrl = string

export const isObjectUrl = (url: string): url is ObjectUrl => {
  if (!url || !URL.canParse(url)) return false

  const parsedUrl = URL.parse(url)
  return parsedUrl ? parsedUrl.protocol === 'blob:' : false
}
