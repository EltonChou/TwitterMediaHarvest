/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { BaseIDB, type IDBMirgration, versionRange } from '../base'
import migrate1 from './migrations/version1'
import migrate2 from './migrations/version2'
import migrate3 from './migrations/version3'
import type { DownloadDBSchema, DownloadDBVersion } from './schema'

export class DownloadIDB extends BaseIDB<DownloadDBSchema, DownloadDBVersion> {
  databaseName = 'download'
}

const migrations: Map<
  DownloadDBVersion,
  IDBMirgration<DownloadDBSchema>
> = new Map([
  [1, migrate1],
  [2, migrate2],
  [3, migrate3],
])

export const downloadIDB = new DownloadIDB(3).onUpgrade(
  (database, oldVersion, newVersion, transaction, event) => {
    for (const version of versionRange<DownloadDBVersion>(
      oldVersion,
      newVersion
    )) {
      const migrate = migrations.get(version)
      if (migrate) migrate(database, oldVersion, newVersion, transaction, event)
    }
  }
)
