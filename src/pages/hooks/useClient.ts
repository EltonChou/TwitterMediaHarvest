/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Client } from '#domain/entities/client'
import type { IClientRepository } from '#domain/repositories/client'
import { useEffect, useState } from 'react'

const useClient = (clientInfoRepo: IClientRepository) => {
  const [isLoaded, setLoaded] = useState(false)
  const [client, setClient] = useState<Client>()

  useEffect(() => {
    clientInfoRepo.get().then(result => {
      if (result.value) setClient(result.value)
      setLoaded(true)
    })
  }, [clientInfoRepo])

  return {
    isLoaded,
    uuid: client ? client.id.value : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  }
}

export default useClient
