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
