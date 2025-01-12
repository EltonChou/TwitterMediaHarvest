/* eslint-disable no-console */
interface User {
  id?: string
  clientId: string
}

export const init = () => console.info('Initialize montior.')
export const setUser = (user: User) =>
  console.info(`Set user. (client_id: ${user.clientId})`)
