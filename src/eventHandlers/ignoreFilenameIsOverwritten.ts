import { DomainEventHandler } from '#domain/eventPublisher'
import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'

export const ignoreFilenameOverwritten =
  (warningSettingsRepo: IWarningSettingsRepo): DomainEventHandler<IDomainEvent> =>
  async () => {
    await warningSettingsRepo.save({ ignoreFilenameOverwritten: true })
  }
