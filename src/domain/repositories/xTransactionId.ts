/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { XTransactionId } from '#domain/valueObjects/xTransactionId'
import { ICache } from './cache'

export type TransactionIdKey = [path: string, method: string]
export type IXTransactionIdCache = ICache<XTransactionId, TransactionIdKey>
