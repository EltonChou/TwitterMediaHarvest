/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockWarningSettingsRepo } from '#mocks/repositories/warningSettings'
import IntegrationOptions from './IntegrationOptions'
import { queryByTestId, render, waitFor } from '@testing-library/react'
import 'core-js/stable/structured-clone'
import React from 'react'

describe('unit test for IntegrationOptions component', () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()
  const warningSettingsRepo = new MockWarningSettingsRepo()

  afterAll(() => Object.assign(global, { __BROWSER__: 'chrome' }))

  it.each(['chrome', 'edge', 'firefox'])('match %s snapshot', target => {
    Object.assign(global, { __BROWSER__: target })

    const { container, unmount } = render(
      <IntegrationOptions
        downloadSettingsRepo={downloadSettingsRepo}
        warningSettingsRepo={warningSettingsRepo}
      />
    )

    const aria2ExtLink = queryByTestId(container, 'aria2-ext-link')

    waitFor(() => {
      expect(container).toMatchSnapshot(target)
      if (target !== 'firefox') {
        expect(aria2ExtLink).toBeInTheDocument()
      } else {
        expect(aria2ExtLink).not.toBeInTheDocument()
      }
    })

    unmount()
  })
})
