/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEventHandler } from '#domain/eventPublisher'

/* eslint-disable no-console */
export const showUpdateMessageInConsole: DomainEventHandler<
  DomainEventMap['runtime:status:updated']
> = event => {
  console.group('The extension has been updated. Expand to see the details.')
  console.info('Previous version:', event.previousVersion)
  console.info('Current version:', event.currentVersion)
  console.groupEnd()
}
