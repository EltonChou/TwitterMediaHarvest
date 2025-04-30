/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { SolutionId, SolutionQuota } from '#domain/entities/solutionQuota'

export interface ISolutionQuotaRepository {
  get(solutionId: SolutionId): Promise<SolutionQuota | undefined>
  save(solutionQuota: SolutionQuota): Promise<void>
}
