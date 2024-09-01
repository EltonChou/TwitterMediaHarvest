import type { DownloadSettings } from '#schema'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadSettings = (): DownloadSettings => ({
  aggressiveMode: faker.datatype.boolean(),
  askWhereToSave: faker.datatype.boolean(),
  enableAria2: faker.datatype.boolean(),
})
