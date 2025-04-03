import { SolutionQuota } from '#domain/entities/solutionQuota'
import { Factory } from '#domain/factories/base'
import type { ISolutionQuotaRepository } from '#domain/repositories/solutionQuota'
import { ResettableQuota } from '#domain/valueObjects/resettableQuota'
import FetchTweetSolutionId from '#enums/FetchTweetSolution'
import { IStorageProxy } from '#libs/storageProxy'
import { SolutionQuotaCollection as SolutionQuotaSchema } from '#schema'

type LazySolutionId = FetchTweetSolutionId.Native

export class SolutionQuotaRepository implements ISolutionQuotaRepository {
  constructor(readonly storageProxy: IStorageProxy<SolutionQuotaSchema>) {}

  async get(solutionId: LazySolutionId): Promise<SolutionQuota | undefined> {
    const value = await this.storageProxy.getItemByKey(
      'solutionQuotaCollection'
    )

    if (!value) return undefined
    const { solutionQuotaCollection: collection } = value

    if (!(solutionId in collection)) return undefined

    const props = collection[solutionId]
    if (!props) return undefined

    return SolutionQuota.create(solutionId, {
      isRealtime: false,
      quota: new ResettableQuota({
        quota: props.quota,
        resetAt: props.resetAt,
      }),
    })
  }

  async save(solutionQuota: SolutionQuota): Promise<void> {
    const value = await this.storageProxy.getItemByKey(
      'solutionQuotaCollection'
    )

    if (!value) {
      await this.storageProxy.setItem({
        solutionQuotaCollection:
          solutionQuotaEntityToSolutionQuotaDBItem(solutionQuota),
      })

      return
    }

    await this.storageProxy.setItem({
      solutionQuotaCollection: {
        ...value.solutionQuotaCollection,
        ...solutionQuotaEntityToSolutionQuotaDBItem(solutionQuota),
      },
    })
  }
}

const solutionQuotaEntityToSolutionQuotaDBItem: Factory<
  SolutionQuota,
  SolutionQuotaSchema<LazySolutionId>['solutionQuotaCollection']
> = solutionQuota =>
  solutionQuota.mapBy((id, props) => {
    return {
      [id.value as LazySolutionId]: {
        quota: props.quota.remaining,
        resetAt: props.quota.resetTime,
        warnedAt: props.warnedAt,
      },
    }
  })
