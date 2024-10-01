/**
 * @jest-environment jsdom
 */
import { MockFeatureSettingsRepository } from '#mocks/repositories/fetureSettings'
import PopupFeatureBlock from './PopupFeatureBlock'
import { render, waitFor } from '@testing-library/react'
import React from 'react'

describe('unit test for PopupFeatureBlock component', () => {
  const featureSettingsRepo = new MockFeatureSettingsRepository()

  it('match snapshot', () => {
    const { container } = render(
      <PopupFeatureBlock featureSettingsRepo={featureSettingsRepo} />
    )

    waitFor(() => expect(container).toMatchSnapshot())
  })
})
