import type { IDBMirgration } from '#libs/idb/base'
import type { DownloadDBSchema } from '#schema'

const migrate: IDBMirgration<DownloadDBSchema> = database => {
  database.createObjectStore('record', { keyPath: 'id' })
}

export default migrate
