import { useCallback, useMemo } from 'react'
import { permissions } from 'webextension-polyfill'
import type { Permissions } from 'webextension-polyfill'

type Permission = NonNullable<Permissions.Permissions['permissions']>[number]

/**
 * Request / remove optional extension permissions.
 *
 * @returns `[grant, revoke]`
 * - `grant`: prompts the user for the permissions; resolves `true` if granted.
 * - `revoke`: removes the permissions; resolves `true` if removed.
 *
 * Neither rejects: a browser error is logged and resolves `false`.
 *
 * @example
 * const [grant, revoke] = useExtPermissions('management')
 * const [grant, revoke] = useExtPermissions('management', 'downloads')
 */
const useExtPermissions = (
  ...args: Permission[]
): readonly [grant: () => Promise<boolean>, revoke: () => Promise<boolean>] => {
  // `args` is a new array every render; key on its contents so the callbacks stay stable.
  const key = JSON.stringify(args)
  const perms = useMemo<Permission[]>(() => JSON.parse(key), [key])
  return [
    useCallback(
      () => permissions.request({ permissions: perms }).catch(logAndFail),
      [perms]
    ),
    useCallback(
      () => permissions.remove({ permissions: perms }).catch(logAndFail),
      [perms]
    ),
  ]
}

const logAndFail = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[useExtPermissions]', error)
  return false
}

export default useExtPermissions
