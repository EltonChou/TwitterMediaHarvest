import { getNotifier } from './browserNotifier'
import * as Browser from 'webextension-polyfill'

describe('unit test for browser notifier', () => {
  const notifier = getNotifier()

  it('can notify with id', () => {
    const mockCreate = jest
      .spyOn(Browser.notifications, 'create')
      .mockImplementationOnce(jest.fn())

    notifier.notify('notification id', {
      message: 'notification message',
      title: 'notification title',
      type: 'basic',
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    mockCreate.mockClear()
  })

  it('can notify without id', () => {
    const mockCreate = jest
      .spyOn(Browser.notifications, 'create')
      .mockImplementationOnce(jest.fn())

    notifier.notify({
      message: 'notification message',
      title: 'notification title',
      type: 'basic',
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    mockCreate.mockClear()
  })
})
