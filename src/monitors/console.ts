/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/* eslint-disable no-console */
interface User {
  id?: string
  clientId: string
}

export const init = () => console.info('Initialize montior.')
export const setUser = (user: User) =>
  console.info(`Set user. (client_id: ${user.clientId})`)
