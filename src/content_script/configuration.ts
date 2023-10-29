/* eslint-disable react-hooks/rules-of-hooks */
import { SentryExceptionRepository } from './repos'
import { FeaturesRepository } from '@backend/settings/featureSettings/repository'
import { LocalExtensionStorageProxy } from '@libs/proxy'

export const localStorage = new LocalExtensionStorageProxy()
export const featureRepo = new FeaturesRepository(localStorage)
export const exceptionRepo = new SentryExceptionRepository(localStorage)
