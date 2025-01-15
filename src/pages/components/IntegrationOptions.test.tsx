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

  afterAll(() => (process.env.TARGET = 'test'))

  it.each(['chrome', 'edge', 'firefox'])('match %s snapshot', target => {
    process.env.TARGET = target

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
