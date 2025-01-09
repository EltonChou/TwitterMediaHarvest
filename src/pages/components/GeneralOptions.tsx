import type {
  ISettingsRepository,
  ISettingsVORepository,
} from '#domain/repositories/settings'
import type { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import { TweetUser } from '#domain/valueObjects/tweetUser'
import PatternToken from '#enums/patternToken'
import { getText as i18n } from '#libs/i18n'
import useDownloadSettings from '#pages/hooks/useDownloadSettings'
import useFilenameSettingsForm from '#pages/hooks/useFilenameSettingsForm'
import type { DownloadSettings } from '#schema'
import {
  HelperMessage,
  RichFeatureSwitch,
  RichFeatureSwithProps,
} from './controls/featureControls'
import {
  PatternToken as PatternTokenComponent,
  SortablePatternToken,
} from './controls/filenameControls'
import { Button, Flex, HStack, Input, Select, VStack } from '@chakra-ui/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import React, { memo } from 'react'

type TokenPanelProps = {
  handleTokenToggle: (token: PatternToken, state: 'enable' | 'disable') => void
  handleTokenSort: (sourceIndex: number, destinationIndex: number) => void
  pattern: PatternToken[]
  patternRecords: ReadonlyArray<PatternTokenRecord>
  previewFilename: string
}

type PatternTokenRecord = {
  token: PatternToken
  testId: string
  localizedName: string
}

const filenameTokenRecords: ReadonlyArray<PatternTokenRecord> = [
  {
    localizedName: i18n('Account', 'options:general:filenameToken'),
    token: PatternToken.Account,
    testId: 'pattern-token-account',
  },
  {
    localizedName: i18n('Account ID', 'options:general:filenameToken'),
    token: PatternToken.AccountId,
    testId: 'pattern-token-account-id',
  },
  {
    localizedName: i18n('Tweet ID', 'options:general:filenameToken'),
    token: PatternToken.TweetId,
    testId: 'pattern-token-token-id',
  },
  {
    localizedName: i18n('Hash', 'options:general:filenameToken'),
    token: PatternToken.Hash,
    testId: 'pattern-token-hash',
  },
  {
    localizedName: i18n('Serial', 'options:general:filenameToken'),
    token: PatternToken.Serial,
    testId: 'pattern-token-serial',
  },
  {
    localizedName: i18n('Download Date', 'options:general:filenameToken'),
    token: PatternToken.Date,
    testId: 'pattern-token-date',
  },
  {
    localizedName: i18n('Tweet Date', 'options:general:filenameToken'),
    token: PatternToken.TweetDate,
    testId: 'pattern-token-tweet-date',
  },
  {
    localizedName: i18n('Tweet Datetime', 'options:general:filenameToken'),
    token: PatternToken.TweetDatetime,
    testId: 'pattern-token-tweet-date-time',
  },
]

export const TokenPanel = memo(
  ({
    handleTokenToggle,
    handleTokenSort,
    pattern,
    previewFilename,
    patternRecords,
  }: TokenPanelProps) => {
    const sortedTokens = patternRecords
      .filter(({ token }) => pattern.includes(token))
      .sort((a, b) => pattern.indexOf(a.token) - pattern.indexOf(b.token))

    return (
      <>
        <Flex minH={'1.5em'} fontSize="1.2em">
          {previewFilename}
        </Flex>

        <DndContext
          sensors={useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={event => {
            const { active, over } = event
            if (active.id === over?.id) return
            if (active.data.current && over?.data.current)
              handleTokenSort(
                active.data.current.sortable.index,
                over.data.current.sortable.index
              )
          }}
        >
          <Flex
            justifyContent={'flex-start'}
            gap={2}
            flexWrap={'wrap'}
            marginBottom={'0.5rem'}
            minH={'1.5em'}
          >
            <SortableContext items={sortedTokens.map(({ token }) => token)}>
              {sortedTokens.map(({ localizedName, token, testId }) => (
                <SortablePatternToken
                  key={token}
                  name={localizedName}
                  token={token}
                  handleRemove={() => handleTokenToggle(token, 'disable')}
                  testId={'sortable-' + testId}
                />
              ))}
            </SortableContext>
          </Flex>
        </DndContext>

        <Flex justifyContent={'flex-start'} gap={'2'} flexWrap={'wrap'}>
          {patternRecords.map(({ localizedName, token, testId }) => (
            <PatternTokenComponent
              key={token}
              tokenName={localizedName}
              isOn={pattern.includes(token)}
              handleChange={s =>
                handleTokenToggle(token, s ? 'enable' : 'disable')
              }
              testId={testId}
            />
          ))}
        </Flex>
      </>
    )
  }
)

const previewMediaFile = new TweetMediaFile({
  tweetId: '1145141919810',
  tweetUser: new TweetUser({
    screenName: 'tweetUser',
    userId: '306048589',
    displayName: 'NickName',
  }),
  createdAt: new Date(2222, 1, 2, 12, 5, 38),
  serial: 2,
  hash: '2vfn8shkjvd98892pR',
  source: 'https://somewhere.com',
  type: 'image',
  ext: '.jpg',
})

export type GeneralOptionsProps = {
  filenameSettingsRepo: ISettingsVORepository<FilenameSetting>
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
}

interface AskWherToSaveFeatureSwitchProps {
  isOn: boolean
  handleClick: () => void
}

const AskWherToSaveFeatureSwitch = ({
  isOn,
  handleClick,
}: AskWherToSaveFeatureSwitchProps) => (
  <RichFeatureSwitch
    name={i18n('Ask where to save files.', 'options:general')}
    desc={i18n(
      'Show the file chooser or not when download was triggered. Recommend to disable this option.',
      'options:general'
    )}
    isOn={isOn}
    handleClick={handleClick}
    testId="askWhereToSave-feature-switch"
  />
)

interface FilenameControlFeatureProps extends TokenPanelProps {
  message: HelperMessage | undefined
}

const FilenameControlFeature = (props: FilenameControlFeatureProps) => (
  <RichFeatureSwitch
    name={i18n('Filename pattern', 'options:general')}
    desc={i18n(
      'You can choose what info to be included in the filename.',
      'options:general'
    )}
    message={props.message}
    cursor="default"
    isOn={true}
    testId="filenamePattern-feature-switch"
  >
    <TokenPanel
      pattern={props.pattern}
      handleTokenToggle={props.handleTokenToggle}
      handleTokenSort={props.handleTokenSort}
      previewFilename={props.previewFilename}
      patternRecords={filenameTokenRecords}
    />
  </RichFeatureSwitch>
)

interface DirectoryControlFeatureProps
  extends Pick<RichFeatureSwithProps, 'message' | 'isOn' | 'handleClick'> {
  directory: string
  setDirectory: (directory: string) => void
  isDisabled: boolean
  isValidDirectory: boolean
  isDataModified: boolean
}

const DirectoryControlFeature = (props: DirectoryControlFeatureProps) => (
  <RichFeatureSwitch
    name={i18n('Create sub-directory', 'options:general')}
    message={props.message}
    desc={i18n(
      'Create sub-directory under the default download directory. Sub-directory can be seperated with "/".',
      'options:general'
    )}
    isOn={props.isOn}
    handleClick={props.handleClick}
    cursor="pointer"
    testId="suDirectory-feature-switch"
  >
    <Input
      placeholder={'twitter_media_harvest'}
      focusBorderColor={
        props.isDataModified
          ? props.isValidDirectory
            ? 'green.300'
            : 'red.300'
          : 'blue.300'
      }
      value={props.directory}
      onInput={e => props.setDirectory(e.currentTarget.value)}
      onChange={e => props.setDirectory(e.currentTarget.value)}
      isDisabled={props.isDisabled}
      isInvalid={!props.isValidDirectory}
      data-testid="subDirectory-input"
    />
  </RichFeatureSwitch>
)

interface FileAggregationFeatureProps
  extends Pick<RichFeatureSwithProps, 'isOn' | 'handleClick'> {
  isDisabled: boolean
  toggle: () => void
}

const FileAggregationFeature = (props: FileAggregationFeatureProps) => (
  <RichFeatureSwitch
    name={i18n('Group Files', 'options:general')}
    desc={i18n('Group files by the selected attribute.', 'options:general')}
    isOn={props.isOn}
    handleClick={props.handleClick}
    cursor="pointer"
    testId="fileAggregation-feature-switch"
  >
    <Select isDisabled={props.isDisabled} onChange={props.toggle}>
      <option value="{account}">
        {i18n('Account', 'options:general:filenameToken')}
      </option>
    </Select>
  </RichFeatureSwitch>
)

const GeneralOptions = (props: GeneralOptionsProps) => {
  const {
    filenameSetting,
    status: formStatus,
    message: formMsg,
    handler: formHandler,
  } = useFilenameSettingsForm(props.filenameSettingsRepo)
  const {
    settings: downloadSettings,
    toggler,
    canAskSaveLocation,
  } = useDownloadSettings(props.downloadSettingsRepo)

  return (
    <>
      <form
        onReset={e => {
          e.preventDefault()
          formHandler.reset()
          if (downloadSettings.askWhereToSave === true) toggler.askWhereToSave()
        }}
        onSubmit={e => {
          e.preventDefault()
          formHandler.submit()
          props.downloadSettingsRepo.save(downloadSettings)
        }}
      >
        <VStack>
          {canAskSaveLocation && (
            <AskWherToSaveFeatureSwitch
              isOn={downloadSettings.askWhereToSave}
              handleClick={toggler.askWhereToSave}
            />
          )}
          <FilenameControlFeature
            pattern={filenameSetting.mapBy(props => props.filenamePattern)}
            handleTokenToggle={(token, state) =>
              formHandler.changePatternTokenState(state)(token)
            }
            handleTokenSort={formHandler.sortPatternToken}
            previewFilename={filenameSetting.makeFilename(previewMediaFile, {
              noDir: true,
            })}
            patternRecords={filenameTokenRecords}
            message={formMsg.filenamePattern}
          />
          <DirectoryControlFeature
            directory={filenameSetting.mapBy(props => props.directory)}
            setDirectory={formHandler.setDirectory}
            isDisabled={filenameSetting.mapBy(props => props.noSubDirectory)}
            isValidDirectory={formStatus.directoryIsValid}
            isDataModified={formStatus.dataIsChanged}
            isOn={!filenameSetting.mapBy(props => props.noSubDirectory)}
            handleClick={formHandler.toggleSubDirectory}
          />
          <FileAggregationFeature
            isDisabled={!filenameSetting.mapBy(props => props.fileAggregation)}
            toggle={formHandler.toggleAggregationToken}
            isOn={filenameSetting.mapBy(props => props.fileAggregation)}
            handleClick={formHandler.toggleAggregationToken}
          />
          <HStack>
            <Button
              type="reset"
              colorScheme={'red'}
              variant={'outline'}
              data-testid="form-reset-button"
            >
              {i18n('Reset', 'options:general:button')}
            </Button>
            <Button
              type="submit"
              colorScheme={'green'}
              isDisabled={!Object.values(formStatus).every(v => v)}
              data-testid="form-submit-button"
            >
              {i18n('Save', 'options:general:button')}
            </Button>
          </HStack>
        </VStack>
      </form>
    </>
  )
}

export default GeneralOptions
