import { IClientInfoRepository } from './repositories'

export class ClientInfoUseCase {
  constructor(private infoRepo: IClientInfoRepository) {}

  async sync(): Promise<void> {
    const info = await this.infoRepo.getInfo()
    if (info.needSync) await this.infoRepo.updateStats(info.props.csrfToken)
  }
}
