export const makeApiUrl = (
  path: string,
  query?: Record<string, string | number>
): URL => {
  if (!path.startsWith('/'))
    throw new Error(`path should starts with \`/\`. (path: ${path})`)

  const url = new URL(path, `https://${process.env.API_HOSTNAME}`)

  if (query)
    Object.entries(query).forEach(([name, value]) =>
      url.searchParams.set(name, String(value))
    )

  return url
}
