import { DomainEventHandler } from '#domain/eventPublisher'

export const showUpdateMessageInConsole: DomainEventHandler<
  DomainEventMap['runtime:status:updated']
> = event => {
  console.group('The extension has been updated. Expand to see the details.')
  console.info('Previous version:', event.previousVersion)
  console.info('Current version:', event.currentVersion)
  console.groupEnd()
}
