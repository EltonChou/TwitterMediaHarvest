/**
 * @jest-environment jsdom
 */
import PatternToken from '#enums/patternToken'
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockFilenameSettingRepository } from '#mocks/repositories/filenameSetting'
import { TokenPanel } from './GeneralOptions'
import GeneralOptions from './GeneralOptions'
import {
  act,
  fireEvent,
  getByTestId,
  render,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import 'core-js/stable/structured-clone'
import React from 'react'

describe('unit test for TokenPanel component', () => {
  const mockToggle = jest.fn()
  const mockSort = jest.fn()

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can drag & drop sortable token', async () => {
    // TODO: Find a proper way to tet drag & drop

    const { container, unmount } = render(
      <TokenPanel
        handleTokenToggle={mockToggle}
        handleTokenSort={mockSort}
        pattern={[
          PatternToken.Account,
          PatternToken.AccountId,
          PatternToken.Hash,
        ]}
        previewFilename={'preview filename'}
        patternRecords={[
          {
            localizedName: 'account',
            testId: 'token-account',
            token: PatternToken.Account,
          },
          {
            localizedName: 'account-id',
            testId: 'token-account-id',
            token: PatternToken.AccountId,
          },
          {
            localizedName: 'hash',
            testId: 'token-hash',
            token: PatternToken.Hash,
          },
        ]}
      />
    )

    expect(container).toMatchSnapshot()

    unmount()
  })

  it('can toggle token', async () => {
    const mockToggle = jest.fn()
    const mockSort = jest.fn()
    const { container, unmount } = render(
      <TokenPanel
        handleTokenToggle={mockToggle}
        handleTokenSort={mockSort}
        pattern={[
          PatternToken.Account,
          PatternToken.AccountId,
          PatternToken.Hash,
        ]}
        previewFilename={'preview filename'}
        patternRecords={[
          {
            localizedName: 'account',
            testId: 'token-account',
            token: PatternToken.Account,
          },
          {
            localizedName: 'account-id',
            testId: 'token-account-id',
            token: PatternToken.AccountId,
          },
          {
            localizedName: 'hash',
            testId: 'token-hash',
            token: PatternToken.Hash,
          },
        ]}
      />
    )

    expect(container).toMatchSnapshot('before-toggle')

    act(() => {
      fireEvent.click(getByTestId(container, 'token-account'))
      fireEvent.click(getByTestId(container, 'token-account-id'))
      fireEvent.click(getByTestId(container, 'token-hash'))
    })

    expect(container).toMatchSnapshot('after-enable')

    act(() => {
      fireEvent.click(getByTestId(container, 'token-account'))
      fireEvent.click(getByTestId(container, 'token-account-id'))
      fireEvent.click(getByTestId(container, 'sortable-token-hash-close'))
    })

    expect(container).toMatchSnapshot('before-toggle')

    unmount()
  })
})

describe('unit test for GeneralOptions component', () => {
  const mockFilenameSettingsRepo = new MockFilenameSettingRepository()
  const mockDownloadSettingsRepo = new MockDownloadSettingsRepository()

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can render properly', async () => {
    jest.spyOn(mockDownloadSettingsRepo, 'get').mockResolvedValue({
      aggressiveMode: false,
      askWhereToSave: true,
      enableAria2: false,
    })

    const { container, unmount } = render(
      <GeneralOptions
        filenameSettingsRepo={mockFilenameSettingsRepo}
        downloadSettingsRepo={mockDownloadSettingsRepo}
      />
    )

    await waitFor(() => expect(container).toMatchSnapshot())

    unmount()
  })

  describe.each(['chrome', 'firefox'])('test user behavior in %s', browser => {
    beforeAll(() => {
      Object.assign(global, { __BROWSER__: browser })
      jest.spyOn(mockDownloadSettingsRepo, 'get').mockResolvedValue({
        aggressiveMode: false,
        askWhereToSave: false,
        enableAria2: false,
      })
    })

    afterAll(() => {
      Object.assign(global, { __BROWSER__: 'chrome' })
    })

    it('the form can be submitted or reset', async () => {
      const { container, unmount } = render(
        <GeneralOptions
          filenameSettingsRepo={mockFilenameSettingsRepo}
          downloadSettingsRepo={mockDownloadSettingsRepo}
        />
      )

      const mockDownloadSettingsSave = jest.spyOn(
        mockDownloadSettingsRepo,
        'save'
      )

      expect(container).toMatchSnapshot('default-form')

      const user = userEvent.setup()

      await user.clear(getByTestId(container, 'subDirectory-input'))
      await user.type(
        getByTestId(container, 'subDirectory-input'),
        'a-valid-dir'
      )
      await user.click(getByTestId(container, 'form-submit-button'))

      expect(container).toMatchSnapshot('submitted-form')
      await waitFor(() => {
        expect(mockDownloadSettingsSave).toHaveBeenCalledTimes(1)
      })

      await user.click(getByTestId(container, 'form-reset-button'))

      expect(container).toMatchSnapshot('default-form')

      unmount()
    })
  })
})
