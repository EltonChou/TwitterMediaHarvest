/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEvent } from './base'

export class UnknownNotificationButtonClicked
  extends DomainEvent
  implements UnknownNotificationButtonClickedEvent
{
  readonly buttonIndex: number

  constructor(buttonIndex: number) {
    super('notification:general:unknownButton:clicked')
    this.buttonIndex = buttonIndex
  }
}
