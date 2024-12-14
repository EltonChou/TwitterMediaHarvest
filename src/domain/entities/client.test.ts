import ClientWasSynced from '#domain/events/ClientWasSynced'
import { generateUsageStatistics } from '#utils/test/usageStatistics'
import { Client, ClientUUID } from './client'

describe('unit test for client entity.', () => {
  it('can check the client should sync or not', async () => {
    const clientId = new ClientUUID(crypto.randomUUID())
    const syncedClientInfo = new Client(clientId, {
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
      usageStatistics: generateUsageStatistics(),
    })
    const unsyncedClientInfo = new Client(clientId, {
      uninstallCode: 'code',
      syncedAt: new Date(0).getTime(),
      syncToken: 'token',
      usageStatistics: generateUsageStatistics(),
    })

    expect(syncedClientInfo.shouldSync).toBeFalsy()
    expect(unsyncedClientInfo.shouldSync).toBeTruthy()
  })

  it('can update sync token', async () => {
    const clientId = new ClientUUID(crypto.randomUUID())
    const client = new Client(clientId, {
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
      usageStatistics: generateUsageStatistics(),
    })

    client.updateSyncToken('another_token')
    expect(client.syncToken).toBe('another_token')
    expect(client.events.some(event => event instanceof ClientWasSynced))
  })

  it('can provide unsinstall url', () => {
    const clientId = new ClientUUID(crypto.randomUUID())
    const client = new Client(clientId, {
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
      usageStatistics: generateUsageStatistics(),
    })

    const url = new URL(client.uninstallUrl)

    expect(url.pathname).toMatch('/v1/clients/' + clientId.value + '/uninstall')
    expect(url.searchParams.get('uninstallCode')).toBe('code')
  })
})
