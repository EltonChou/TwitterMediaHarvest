/**
 * @jest-environment jsdom
 */
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import IntegrationOptions from './IntegrationOptions'
import { render, waitFor } from '@testing-library/react'
import React from 'react'

describe('unit test for IntegrationOptions component', () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()

  afterAll(() => (process.env.TARGET = 'test'))

  it.each(['chrome', 'edge', 'firefox'])('match %s snapshot', target => {
    process.env.TARGET = target

    const { container, unmount } = render(
      <IntegrationOptions downloadSettingsRepo={downloadSettingsRepo} />
    )

    waitFor(() => expect(container).toMatchSnapshot(target))

    unmount()
  })
})
