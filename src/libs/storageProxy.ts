export type SchemaKey<T> = string extends T
  ? never
  : number extends T
  ? never
  : boolean extends T
  ? never
  : keyof T

export type SchemaValue<T> = string extends T
  ? never
  : number extends T
  ? never
  : boolean extends T
  ? never
  : T[SchemaKey<T>]

export interface IStorageProxy<SchemaT> {
  getItemByKey<Key extends SchemaKey<SchemaT>>(
    key: Key
  ): Promise<Pick<SchemaT, Key> | undefined>
  getItemByDefaults<Defaults extends Partial<SchemaT>>(
    defaults: Defaults
  ): Promise<Defaults>
  setItem(item: Partial<SchemaT>): Promise<void>
  removeItem<Key extends SchemaKey<SchemaT>>(keys: Key | Key[]): Promise<void>
}
