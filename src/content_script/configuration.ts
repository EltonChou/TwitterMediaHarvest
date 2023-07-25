/* eslint-disable react-hooks/rules-of-hooks */
import { FeaturesRepository } from '@backend/settings/featureSettings/repository'
import { LocalExtensionStorageProxy } from '@libs/proxy'
import Browser from 'webextension-polyfill'

const localStorage = new LocalExtensionStorageProxy(Browser.storage.local)
export const featureRepo = new FeaturesRepository(localStorage)
