import { Client, ClientUUID } from '#domain/entities/client'
import { generateUsageStatistics } from './usageStatistics'

export const generateClient = (syncedAt = 0) =>
  new Client(new ClientUUID('uuid'), {
    syncedAt,
    syncToken: 'syncToken',
    uninstallCode: 'code',
    usageStatistics: generateUsageStatistics(),
  })
