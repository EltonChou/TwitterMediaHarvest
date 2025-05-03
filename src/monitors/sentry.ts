/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  BrowserClient,
  captureConsoleIntegration,
  defaultStackParser,
  getCurrentScope,
  makeFetchTransport,
  setUser as setSentryUser,
} from '@sentry/browser'

interface SentryUser {
  clientId: string
  id?: string
}

export const init = () => {
  const client = new BrowserClient({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 0.8,
    environment: process.env.NODE_ENV,
    release: __RELEASE_NAME__,
    ignoreErrors: [
      'Failed to fetch',
      'network error',
      'Download canceled by the user',
      'intermediate value',
    ],
    integrations: [
      captureConsoleIntegration({ handled: true, levels: ['error'] }),
    ],
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    attachStacktrace: true,
    sendClientReports: true,
  })

  getCurrentScope().setClient(client)
  client.init()
}

export const setUser = (user: SentryUser) =>
  setSentryUser({ client_id: user.clientId })
