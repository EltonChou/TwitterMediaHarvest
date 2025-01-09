import {
  AggregationToken,
  FilenameSetting,
} from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'
import { faker } from '@faker-js/faker/locale/en'

export const generateFilenameSetting = () =>
  new FilenameSetting({
    directory: 'dif',
    fileAggregation: faker.datatype.boolean(),
    groupBy: AggregationToken.Account,
    noSubDirectory: faker.datatype.boolean(),
    filenamePattern: faker.helpers.arrayElements([
      PatternToken.Account,
      PatternToken.Hash,
      PatternToken.Serial,
      PatternToken.TweetId,
    ]),
  })
