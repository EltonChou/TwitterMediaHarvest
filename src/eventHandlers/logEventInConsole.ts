/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'

/* eslint-disable no-console */
export const logEventInConsole: DomainEventHandler<IDomainEvent> = event => {
  console.group('Event received')
  console.info('Event name:', event.name)
  console.dir(event, { depth: null, colors: true })
  console.groupEnd()
}
