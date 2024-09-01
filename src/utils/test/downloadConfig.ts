import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import ConflictAction from '#enums/ConflictAction'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadConfig = () =>
  new DownloadConfig({
    conflictAction: faker.helpers.arrayElement([
      ConflictAction.Overwrite,
      ConflictAction.Prompt,
      ConflictAction.Uniquify,
    ]),
    filename: faker.system.fileName(),
    url: faker.internet.url(),
    saveAs: faker.datatype.boolean(),
  })
