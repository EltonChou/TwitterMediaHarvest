import type { FeatureSettings } from '#schema'
import { faker } from '@faker-js/faker'

export const generateFeatureSettings = (): FeatureSettings => ({
  autoRevealNsfw: faker.datatype.boolean(),
  includeVideoThumbnail: faker.datatype.boolean(),
  keyboardShortcut: faker.datatype.boolean(),
})
