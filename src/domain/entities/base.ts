/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from '../valueObjects/base'

export abstract class EntityId<Id> extends ValueObject<{ value: Id }> {
  constructor(value: Id) {
    super({ value: value })
  }

  get value() {
    return this.props.value
  }
}

export abstract class Entity<Id extends EntityId<unknown>, Props> {
  constructor(
    readonly id: Id,
    protected props: Props
  ) {}

  mapBy<T>(mapFunc: (id: Id, props: Props) => T): T {
    return mapFunc(this.id, this.props)
  }

  is(that: unknown): boolean {
    if (that === undefined || that === null || !(that instanceof Entity))
      return false
    return this.id.is(that.id)
  }
}
