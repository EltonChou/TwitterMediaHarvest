import { FilenameOverwrittenNotificationDiagnoseButtonClicked } from '#domain/events/FilenameOverwrittenNotificationDiagnoseButtonClicked'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { openDiagnosticsPageInNewTab } from './openDiagnosticsPageInNewTab'
import { runtime, tabs } from 'webextension-polyfill'
import type { Tabs } from 'webextension-polyfill'

describe('openDiagnosticsPageInNewTab', () => {
  it('should open diagnostics page in a new tab', async () => {
    const mockCreateTab = jest
      .spyOn(tabs, 'create')
      .mockResolvedValueOnce({} as Tabs.Tab)
    const event = new FilenameOverwrittenNotificationDiagnoseButtonClicked()
    const expectedUrl = runtime.getURL('options.html#/diagnostics')
    await openDiagnosticsPageInNewTab(event, new MockEventPublisher())
    expect(mockCreateTab).toHaveBeenCalledWith({ url: expectedUrl })
    mockCreateTab.mockRestore()
  })
})
