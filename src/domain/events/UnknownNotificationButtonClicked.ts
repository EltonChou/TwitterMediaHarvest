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
