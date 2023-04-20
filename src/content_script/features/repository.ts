import browser from 'webextension-polyfill'

interface IFeaturesRepository {
  isRevealNsfw(): Promise<boolean>
}

const defaultFeature: FeatureSettings = {
  autoRevealNsfw: false,
  includeVideoThumbnail: false,
}

export class FeaturesRepository implements IFeaturesRepository {
  async isRevealNsfw(): Promise<boolean> {
    const data = (await browser.storage.local.get(defaultFeature)) as FeatureSettings
    return data.autoRevealNsfw
  }
}
