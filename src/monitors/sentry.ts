/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { isProduction } from '#helpers/env'
import type { InitializationOptions, MontiorUser } from '#monitor'
import {
  init as SentryInit,
  captureConsoleIntegration,
  consoleLoggingIntegration,
  defaultStackParser,
  makeFetchTransport,
  setUser as setSentryUser,
} from '@sentry/browser'

/**
 * Builds made from `sample.env` (such as this fork's Safari build) carry a
 * placeholder DSN. Sentry would log "Invalid Sentry Dsn" errors for it, so
 * error reporting is simply left off unless a real DSN is configured.
 */
const hasValidDsn = (dsn: string | undefined): dsn is string =>
  Boolean(dsn && URL.canParse(dsn))

export const init = (options?: InitializationOptions) => {
  if (!hasValidDsn(process.env.SENTRY_DSN)) return

  const integrations = [
    captureConsoleIntegration({ levels: ['error'], handled: true }),
  ]

  if (__LOGGING__)
    integrations.push(consoleLoggingIntegration({ levels: ['error'] }))

  SentryInit({
    dsn: process.env.SENTRY_DSN,
    skipBrowserExtensionCheck: true,
    debug: !isProduction,
    tracesSampleRate: isProduction ? 0.3 : 0.8,
    environment: process.env.NODE_ENV,
    release: __RELEASE_NAME__,
    ignoreErrors: [
      'Failed to fetch',
      'network error',
      'Download canceled by the user',
      'intermediate value',
    ],
    integrations: integrations,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    attachStacktrace: true,
    sendClientReports: true,
    enableLogs: __LOGGING__,
    enableMetrics: __METRICS__,
  })

  const userProvider = options?.providers?.user
  if (userProvider) {
    userProvider().then(user => {
      if (user) setSentryUser(user)
    })
  }
}

export const setUser = (user: MontiorUser) =>
  setSentryUser({ client_id: user.clientId })
