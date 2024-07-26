import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { faker } from '@faker-js/faker'

export const generateDownloadConfig = () =>
  new DownloadConfig({
    conflictAction: 'overwrite',
    filename: faker.system.fileName(),
    url: faker.internet.url(),
    saveAs: faker.datatype.boolean(),
  })
