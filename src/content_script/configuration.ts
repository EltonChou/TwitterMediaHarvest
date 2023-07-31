/* eslint-disable react-hooks/rules-of-hooks */
import { FeaturesRepository } from '@backend/settings/featureSettings/repository'
import { LocalExtensionStorageProxy } from '@libs/proxy'

const localStorage = new LocalExtensionStorageProxy()
export const featureRepo = new FeaturesRepository(localStorage)
