import type { ISettingsVORepository } from '#domain/repositories/settings'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'

export class MockFilenameSettingRepository
  implements ISettingsVORepository<FilenameSetting>
{
  async get(): Promise<FilenameSetting> {
    throw new Error('Method not implemented.')
  }
  async save(settings: FilenameSetting): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async reset(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getDefault(): FilenameSetting {
    throw new Error('Method not implemented.')
  }
}
