/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import { runtime, tabs } from 'webextension-polyfill'

export const openDiagnosticsPageInNewTab: DomainEventHandler<
  IDomainEvent
> = async _event => {
  await tabs.create({
    url: runtime.getURL('index.html#diagnostics'),
  })
}
