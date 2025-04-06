/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type ObjectUrl = string

export const isObjectUrl = (url: string): url is ObjectUrl => {
  if (!url || !URL.canParse(url)) return false

  const parsedUrl = URL.parse(url)
  return parsedUrl ? parsedUrl.protocol === 'blob:' : false
}
