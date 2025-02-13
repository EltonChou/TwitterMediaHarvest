import { generatePortableDownloadHistoryItem } from '#utils/test/v5ProtableDownloadHistoryItem'
import { V5PortableHistory } from './portableDownloadHistory'
import { faker } from '@faker-js/faker/locale/en'

describe('unit test for V5 portable history value object', () => {
  it('can be serialized to demanding format', () => {
    const portableHistory = new V5PortableHistory({
      items: faker.helpers.multiple(generatePortableDownloadHistoryItem),
    })

    expect(JSON.stringify(portableHistory)).toMatch('version')
    expect(JSON.stringify(portableHistory)).toMatch('items')
  })
})
