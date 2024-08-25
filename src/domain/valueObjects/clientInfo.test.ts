import { ClientInfo } from './clientInfo'

describe('unit test for client info.', () => {
  it('can check the client should sync or not', async () => {
    const syncedClientInfo = new ClientInfo({
      uuid: crypto.randomUUID(),
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
    })
    const unsyncedClientInfo = new ClientInfo({
      uuid: crypto.randomUUID(),
      uninstallCode: 'code',
      syncedAt: new Date(0).getTime(),
      syncToken: 'token',
    })

    expect(syncedClientInfo.shouldSync).toBeFalsy()
    expect(unsyncedClientInfo.shouldSync).toBeTruthy()
  })

  it('can access props by attribute getter', () => {
    const uuid = crypto.randomUUID()
    const clientInfo = new ClientInfo({
      uuid: uuid,
      uninstallCode: 'code',
      syncedAt: Date.now(),
      syncToken: 'token',
    })

    expect(clientInfo.syncToken).toBe('token')
    expect(clientInfo.uninstallCode).toBe('code')
    expect(clientInfo.uuid).toBe(uuid)
  })
})
