export interface ICredentialRepository<Credential> {
  get(): Promise<Credential>
}
