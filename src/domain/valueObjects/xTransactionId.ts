/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { toErrorResult, toSuccessResult } from '#utils/result'
import { ValueObject } from './base'

type XTransactionIdProps = {
  method: string
  value: string
  path: string
  endpoint: string
  capturedAt: Date
}

export class XTransactionId extends ValueObject<XTransactionIdProps> {
  static create(
    props: Omit<XTransactionIdProps, 'capturedAt' | 'endpoint'>
  ): Result<XTransactionId> {
    const match = props.path.match(endpointPattern)
    if (!match)
      return toErrorResult(
        new Error(`Cannot parse endpoint from given path: \`${props.path}\``)
      )
    return toSuccessResult(
      new XTransactionId({
        ...props,
        endpoint: match[1],
        capturedAt: new Date(Date.now()),
      })
    )
  }
}

const endpointPattern = /^\/.+\/(.+)$/
