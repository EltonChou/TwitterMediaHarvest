/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { queryByTestId, render, waitFor } from '@testing-library/react'
import React from 'react'
import IntegrationOptions from './IntegrationOptions'

describe('unit test for IntegrationOptions component', () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()

  afterAll(() => (process.env.TARGET = 'test'))

  it.each(['chrome', 'edge', 'firefox'])('match %s snapshot', target => {
    process.env.TARGET = target

    const { container, unmount } = render(
      <IntegrationOptions downloadSettingsRepo={downloadSettingsRepo} />
    )

    const aria2ExtLink = queryByTestId(container, 'aria2-ext-link')

    waitFor(() => {
      expect(container).toMatchSnapshot(target)
      target !== 'firefox'
        ? expect(aria2ExtLink).toBeInTheDocument()
        : expect(aria2ExtLink).not.toBeInTheDocument()
    })

    unmount()
  })
})
