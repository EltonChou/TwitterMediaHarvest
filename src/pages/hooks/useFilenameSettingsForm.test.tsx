/**
 * @jest-environment jsdom
 */
import {
  AggregationToken,
  FilenameSetting,
} from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'
import { MockFilenameSettingRepository } from '#mocks/repositories/filenameSetting'
import useFilenameSettingsForm from './useFilenameSettingsForm'
import { faker } from '@faker-js/faker/locale/en'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import React from 'react'

describe('unit test for useFilenameSettingForm hook', () => {
  afterAll(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
    cleanup()
  })

  describe('submit', () => {
    it('can submit when the form is valid', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )
      const spySave = jest.spyOn(filenameSettingRepo, 'save')
      const { handler } = result.current

      render(<form data-testid="form" onSubmit={handler.submit} />)

      act(() => {
        fireEvent.submit(screen.getByTestId('form'))
      })

      await waitFor(() => {
        expect(spySave).toHaveBeenCalledTimes(1)
        expect(result.current.status.dataIsChanged).toBeFalsy()
      })

      unmount()
    })

    it('cannot submit when the form is invalid', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const spySave = jest.spyOn(filenameSettingRepo, 'save')
      const spyGet = jest.spyOn(filenameSettingRepo, 'get')

      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )

      const TestForm = () => (
        <form data-testid="form" onSubmit={result.current.handler.submit}>
          <input
            data-testid="directory-input"
            placeholder="Enter directory"
            onChange={e => result.current.handler.setDirectory(e.target.value)}
          />
        </form>
      )

      await waitFor(() => {
        expect(spyGet).toHaveBeenCalled()
      })

      const { rerender, getByTestId } = render(<TestForm />)

      act(() => {
        fireEvent.change(getByTestId('directory-input'), {
          target: { value: '../' },
        })
      })

      expect(result.current.status.directoryIsValid).toBeFalsy()

      rerender(<TestForm />)
      act(() => {
        fireEvent.submit(getByTestId('form'))
      })

      expect(spySave).not.toHaveBeenCalled()
      unmount()
    })
  })

  describe('reset', () => {
    it('can reset the form', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )
      const { filenameSetting: originSetting, handler } = result.current
      const mockSave = jest.spyOn(filenameSettingRepo, 'save')
      const spyReset = jest.spyOn(handler, 'reset')

      act(() => {
        handler.toggleAggregationToken()
        handler.toggleSubDirectory()
        handler.reset()
      })

      const { filenameSetting, status } = result.current

      expect(spyReset).toHaveBeenCalled()
      expect(mockSave).not.toHaveBeenCalled()
      expect(status.dataIsChanged).toBeTruthy()
      expect(originSetting.is(filenameSetting)).toBeTruthy()

      unmount()
    })
  })

  describe('directory switch', () => {
    it('can toggle', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )
      const {
        status: originalStatus,
        filenameSetting,
        handler,
      } = result.current
      expect(originalStatus.dataIsChanged).toBeFalsy()

      act(() => handler.toggleSubDirectory())

      const { filenameSetting: newSetting, status } = result.current

      expect(status.dataIsChanged).toBeTruthy()
      expect(newSetting.mapBy(props => props.noSubDirectory)).toBe(
        filenameSetting.mapBy(props => !props.noSubDirectory)
      )

      unmount()
    })
  })

  describe('sub-directory', () => {
    it.each([
      {
        directory: faker.system.directoryPath().substring(1),
        expectError: false,
        description: 'valid directory should be valid',
      },
      {
        directory: faker.system.directoryPath(),
        expectError: true,
        description: 'directory cannot starts with `/`',
      },
      {
        directory: 'directory_with_invalid_character???<>!@',
        expectError: true,
        description: 'directory should not contains `<>:"\\|?*`',
      },
      {
        directory: 'd'.repeat(4097),
        expectError: true,
        description: 'directory should not greater than 4096 characters',
      },
      {
        directory: '../kappa',
        expectError: true,
        description: 'directory should not contains illegal words',
      },
    ])('$description', async ({ directory, expectError }) => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )
      const { handler } = result.current

      render(
        <>
          <label htmlFor="directory-input">Directory</label>
          <input
            id="directory-input"
            data-testid="directory-input"
            placeholder="Enter directory"
            onChange={e => handler.setDirectory(e.target.value)}
          />
        </>
      )
      act(() => {
        fireEvent.change(screen.getByTestId('directory-input'), {
          target: { value: directory },
        })
      })

      const { status, message } = result.current

      expect(status.dataIsChanged).toBeTruthy()

      if (expectError) {
        expect(status.directoryIsValid).toBeFalsy()
      } else {
        expect(status.directoryIsValid).toBeTruthy()
      }

      if (expectError) {
        expect(message.directory?.type).toBe('error')
      } else {
        expect(message.directory).toBeUndefined()
      }

      unmount()
    })
  })

  describe('aggregation token', () => {
    it('can toggle aggreagation', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const spyGet = jest.spyOn(filenameSettingRepo, 'get')
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )

      await waitFor(() => {
        expect(spyGet).toHaveBeenCalled()
      })

      const initSettings = result.current.filenameSetting
      act(result.current.handler.toggleAggregationToken)

      expect(
        result.current.filenameSetting.mapBy(props => props.fileAggregation)
      ).toBe(initSettings.mapBy(props => !props.fileAggregation))

      unmount()
    })

    it.each([AggregationToken.Account])(
      'can set aggregation token',
      async token => {
        const filenameSettingRepo = new MockFilenameSettingRepository()
        const spyGet = jest.spyOn(filenameSettingRepo, 'get')
        const { result, unmount } = renderHook(() =>
          useFilenameSettingsForm(filenameSettingRepo)
        )

        await waitFor(() => {
          expect(spyGet).toHaveBeenCalled()
        })

        act(() => result.current.handler.setAggregationToken(token))

        expect(
          result.current.filenameSetting.mapBy(props => props.groupBy)
        ).toBe(token)

        unmount()
      }
    )
  })

  describe('filename pattern', () => {
    describe('token state', () => {
      it.each([PatternToken.Hash, PatternToken.Account])(
        'can enable token',
        async token => {
          const filenameSettingRepo = new MockFilenameSettingRepository()
          const spyGet = jest
            .spyOn(filenameSettingRepo, 'get')
            .mockResolvedValueOnce(
              new FilenameSetting({
                ...filenameSettingRepo.getDefault().mapBy(props => props),
                filenamePattern: [
                  PatternToken.Account,
                  PatternToken.TweetId,
                  PatternToken.Serial,
                ],
              })
            )
          const { result, unmount } = renderHook(() =>
            useFilenameSettingsForm(filenameSettingRepo)
          )

          await waitFor(() => {
            expect(spyGet).toHaveBeenCalled()
          })

          act(() =>
            result.current.handler.changePatternTokenState('enable')(token)
          )

          expect(
            result.current.filenameSetting.mapBy(props =>
              props.filenamePattern.includes(token)
            )
          ).toBeTruthy()

          unmount()
        }
      )

      it.each([PatternToken.Hash, PatternToken.Account])(
        'can disable token',
        async token => {
          const filenameSettingRepo = new MockFilenameSettingRepository()
          const spyGet = jest
            .spyOn(filenameSettingRepo, 'get')
            .mockResolvedValueOnce(
              new FilenameSetting({
                ...filenameSettingRepo.getDefault().mapBy(props => props),
                filenamePattern: [
                  PatternToken.Account,
                  PatternToken.TweetId,
                  PatternToken.Serial,
                ],
              })
            )
          const { result, unmount } = renderHook(() =>
            useFilenameSettingsForm(filenameSettingRepo)
          )

          await waitFor(() => {
            expect(spyGet).toHaveBeenCalled()
          })

          act(() =>
            result.current.handler.changePatternTokenState('disable')(token)
          )

          expect(
            result.current.filenameSetting.mapBy(props =>
              props.filenamePattern.includes(token)
            )
          ).toBeFalsy()

          unmount()
        }
      )

      it('can provide message if the pattern is invalid', async () => {
        const filenameSettingRepo = new MockFilenameSettingRepository()
        const spyGet = jest
          .spyOn(filenameSettingRepo, 'get')
          .mockResolvedValueOnce(
            new FilenameSetting({
              ...filenameSettingRepo.getDefault().mapBy(props => props),
              filenamePattern: [
                PatternToken.Account,
                PatternToken.TweetId,
                PatternToken.Serial,
              ],
            })
          )
        const { result, unmount } = renderHook(() =>
          useFilenameSettingsForm(filenameSettingRepo)
        )

        await waitFor(() => {
          expect(spyGet).toHaveBeenCalled()
        })

        act(() =>
          result.current.handler.changePatternTokenState('disable')(
            PatternToken.TweetId
          )
        )

        expect(result.current.status.filenamePatternIsValid).toBeFalsy()
        expect(result.current.message.filenamePattern?.type).toBe('error')

        unmount()
      })
    })

    it('can sort pattern token', async () => {
      const filenameSettingRepo = new MockFilenameSettingRepository()
      const spyGet = jest
        .spyOn(filenameSettingRepo, 'get')
        .mockResolvedValueOnce(
          new FilenameSetting({
            ...filenameSettingRepo.getDefault().mapBy(props => props),
            filenamePattern: [
              PatternToken.Account,
              PatternToken.TweetId,
              PatternToken.Serial,
            ],
          })
        )
      const { result, unmount } = renderHook(() =>
        useFilenameSettingsForm(filenameSettingRepo)
      )

      await waitFor(() => {
        expect(spyGet).toHaveBeenCalled()
      })

      act(() => result.current.handler.sortPatternToken(0, 2))

      expect(
        result.current.filenameSetting.mapBy(props => props.filenamePattern)
      ).toStrictEqual([
        PatternToken.TweetId,
        PatternToken.Serial,
        PatternToken.Account,
      ])
      expect(result.current.status.filenamePatternIsValid).toBeTruthy()

      act(() => result.current.handler.sortPatternToken(5, 6))

      expect(
        result.current.filenameSetting.mapBy(props => props.filenamePattern)
      ).toStrictEqual([
        PatternToken.TweetId,
        PatternToken.Serial,
        PatternToken.Account,
      ])
      expect(result.current.status.filenamePatternIsValid).toBeTruthy()

      act(() => result.current.handler.sortPatternToken(1, 6))

      expect(
        result.current.filenameSetting.mapBy(props => props.filenamePattern)
      ).toStrictEqual([
        PatternToken.TweetId,
        PatternToken.Account,
        PatternToken.Serial,
      ])
      expect(result.current.status.filenamePatternIsValid).toBeTruthy()

      act(() => result.current.handler.sortPatternToken(1, -2))

      expect(
        result.current.filenameSetting.mapBy(props => props.filenamePattern)
      ).toStrictEqual([
        PatternToken.Account,
        PatternToken.TweetId,
        PatternToken.Serial,
      ])
      expect(result.current.status.filenamePatternIsValid).toBeTruthy()

      act(() => result.current.handler.sortPatternToken(1, 2))

      expect(
        result.current.filenameSetting.mapBy(props => props.filenamePattern)
      ).toStrictEqual([
        PatternToken.Account,
        PatternToken.Serial,
        PatternToken.TweetId,
      ])
      expect(result.current.status.filenamePatternIsValid).toBeTruthy()

      unmount()
    })
  })
})
