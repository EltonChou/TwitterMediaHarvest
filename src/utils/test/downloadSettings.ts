import type { DownloadSettings } from '#schema'
import { faker } from '@faker-js/faker'

export const generateDownloadSettings = (): DownloadSettings => ({
  aggressiveMode: faker.datatype.boolean(),
  askWhereToSave: faker.datatype.boolean(),
  enableAria2: faker.datatype.boolean(),
})
