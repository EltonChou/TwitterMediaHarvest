import { Entity, EntityId } from '#domain/entities/base'

describe('unit test for value object', () => {
  class TestEntityId extends EntityId<number> {}

  type TestEntityProps = {
    name: string
  }
  class TestEntity extends Entity<TestEntityId, TestEntityProps> {}

  it('can check same entity', () => {
    const a = new TestEntity(new TestEntityId(1), { name: 'a' })
    const renamed_a = new TestEntity(new TestEntityId(1), { name: 'better a' })
    const b = new TestEntity(new TestEntityId(2), { name: 'a' })

    expect(a.is(renamed_a)).toBeTruthy()
    expect(a.is(b)).toBeFalsy()
    expect(a.is(null)).toBeFalsy()
    expect(a.is(undefined)).toBeFalsy()
    expect(a.is(1)).toBeFalsy()
  })

  it('can be mapped', () => {
    const a = new TestEntity(new TestEntityId(1), { name: 'a' })
    const toGreeting = (id: TestEntity['id'], props: TestEntity['props']) =>
      `Hi, I am ${props.name} with id ${id.value}.`

    expect(a.mapBy(toGreeting)).toBe('Hi, I am a with id 1.')
  })
})
