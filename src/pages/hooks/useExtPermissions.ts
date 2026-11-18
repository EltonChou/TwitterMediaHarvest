import { useCallback } from 'react'
import { permissions } from 'webextension-polyfill'
import type { Permissions } from 'webextension-polyfill'

type Permission = NonNullable<Permissions.Permissions['permissions']>[number]

/**
 * Request / remove optional extension permissions.
 *
 * @example
 * const [grant, revoke] = useExtPermissions(['management'])
 * const [grant, revoke] = useExtPermissions('management', 'downloads')
 */
const useExtPermissions = (...args: Array<Permission | Permission[]>) => {
  const perms = args.flat()
  return [
    useCallback(() => permissions.request({ permissions: perms }), [perms]),
    useCallback(() => permissions.remove({ permissions: perms }), [perms]),
  ] as const
}

export default useExtPermissions
