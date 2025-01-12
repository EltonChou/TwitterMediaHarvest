declare module '#monitor' {
  export function init(): void

  export interface MontiorUser {
    id?: string
    clientId: string
  }

  export function setUser(user: MontiorUser): void
}
