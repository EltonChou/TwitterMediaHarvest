/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const API_BASE = `https://${process.env['API_HOSTNAME']}`

export const makeApiUrl = (
  path: string,
  query?: Record<string, string | number>
): URL => {
  if (!path.startsWith('/'))
    throw new Error(`path should starts with \`/\`. (path: ${path})`)

  const url = new URL(path, API_BASE)

  if (query)
    Object.entries(query).forEach(([name, value]) =>
      url.searchParams.set(name, String(value))
    )

  return url
}
