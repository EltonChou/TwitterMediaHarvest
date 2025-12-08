declare module '#monitor' {
  type Providers = {
    user: () => Promise<MontiorUser | undefined>
  }

  type InitializationOptions = {
    providers?: Providers
  }

  export function init(options?: InitializationOptions): void
  export interface MontiorUser {
    id?: string
    clientId: string
  }

  export function setUser(user: MontiorUser): void
}
