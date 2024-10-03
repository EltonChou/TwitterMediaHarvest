import type { DomainEventPublisher } from '#domain/eventPublisher'
import RuntimeInstalled from '#domain/events/RuntimeInstalled'
import RuntimeUpdated from '#domain/events/RuntimeUpdated'
import { getVersion } from '#utils/runtime'
import type { Runtime } from 'webextension-polyfill'

const handleRuntimeInstalled =
  (publisher: DomainEventPublisher): ListenerOf<Runtime.Static['onInstalled']> =>
  async details => {
    if (details.reason === 'browser_update') return

    const currentVersion = getVersion()

    if (details.reason === 'install') {
      await publisher.publish(new RuntimeInstalled(currentVersion))
    }

    if (details.reason === 'update') {
      await publisher.publish(
        new RuntimeUpdated({
          current: currentVersion,
          previous: details?.previousVersion ?? currentVersion,
        })
      )
    }
  }

export default handleRuntimeInstalled
