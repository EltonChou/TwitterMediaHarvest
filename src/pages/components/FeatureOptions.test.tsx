/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import FeatureOptions from './FeatureOptions'
import { queryAllByTestId, render } from '@testing-library/react'
import React from 'react'

describe('unit test for FeatureOptions component', () => {
  const featureSettingsRepo = new MockFeatureSettingsRepository()

  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can render properly', async () => {
    const { container, unmount } = render(
      <FeatureOptions featureSettingsRepo={featureSettingsRepo} />
    )

    expect(queryAllByTestId(container, new RegExp(/.*-feature-switch$/))).toHaveLength(3)
    expect(container).toMatchSnapshot()

    unmount()
  })
})
