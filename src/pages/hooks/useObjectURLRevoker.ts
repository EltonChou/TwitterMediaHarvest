/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { IDownloadRepository } from '#domain/repositories/download'
import type { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { isDownloadCompleted } from '#utils/downloadState'
import { isObjectUrl } from '#utils/url'
import { useEffect } from 'react'
import { downloads } from 'webextension-polyfill'
import type { Downloads } from 'webextension-polyfill'

/**
 * Revoke object URLs of downloads triggered by this extension once they complete.
 */
const useObjectURLRevoker = (
  downloadRepo: IDownloadRepository,
  checkDownloadIsOwnBySelf: CheckDownloadWasTriggeredBySelf
) => {
  useEffect(() => {
    const revokeObjectURL: ListenerOf<Downloads.Static['onChanged']> = async ({
      id,
      state,
    }) => {
      if (!state) return
      if (!isDownloadCompleted(state)) return
      const downloadItem = await downloadRepo.getById(id)
      if (!downloadItem) return
      const isSelfItem = checkDownloadIsOwnBySelf.process({
        item: downloadItem,
        allowJSON: true,
      })

      if (!isSelfItem) return
      if (isObjectUrl(downloadItem.url)) URL.revokeObjectURL(downloadItem.url)
    }

    downloads.onChanged.addListener(revokeObjectURL)
    return () => downloads.onChanged.removeListener(revokeObjectURL)
  }, [downloadRepo, checkDownloadIsOwnBySelf])
}

export default useObjectURLRevoker
