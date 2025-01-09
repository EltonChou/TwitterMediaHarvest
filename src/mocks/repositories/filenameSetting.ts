import type { ISettingsVORepository } from '#domain/repositories/settings'
import {
  AggregationToken,
  FilenameSetting,
} from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'

export class MockFilenameSettingRepository
  implements ISettingsVORepository<FilenameSetting>
{
  protected settings: FilenameSetting
  constructor() {
    this.settings = new FilenameSetting({
      directory: 'download',
      fileAggregation: false,
      filenamePattern: [
        PatternToken.Account,
        PatternToken.TweetId,
        PatternToken.Serial,
      ],
      groupBy: AggregationToken.Account,
      noSubDirectory: false,
    })
  }
  async get(): Promise<FilenameSetting> {
    return this.settings
  }
  async save(settings: FilenameSetting): Promise<void> {
    this.settings = settings
  }
  async reset(): Promise<void> {
    this.settings = this.getDefault()
  }
  getDefault(): FilenameSetting {
    return new FilenameSetting({
      directory: 'download',
      fileAggregation: false,
      filenamePattern: [
        PatternToken.Account,
        PatternToken.TweetId,
        PatternToken.Serial,
      ],
      groupBy: AggregationToken.Account,
      noSubDirectory: false,
    })
  }
}
