import React from 'react'

import { DEFAULT_DIRECTORY } from '@backend/constants'
import { Button, Flex, HStack, Input, VStack } from '@chakra-ui/react'
import useFilenameSettingsForm from '@pages/hooks/useFilenameSettingsForm'
import { RichFeatureSwitch } from './controls/featureControls'
import { PatternToken } from './controls/filenameControls'
import V4FilenameSettingsUsecase from '@backend/settings/filenameSettings/usecase'

type TokenPanelProps = {
  handleTokenToggle: (token: FilenamePatternToken, state: boolean) => void
  pattern: V4FilenamePattern
  previewFilename: string
}

const fp: V4FilenamePattern = ['{account}', '{tweetId}', '{hash}', '{serial}', '{date}']

const TokenPanel = ({ handleTokenToggle, pattern, previewFilename }: TokenPanelProps) => {
  return (
    <>
      <Flex justifyContent={'flex-start'} gap={'2'} flexWrap={'wrap'}>
        {fp.map(p => (
          <PatternToken key={p} tokenName={p} isOn={pattern.includes(p)} handleChange={s => handleTokenToggle(p, s)} />
        ))}
      </Flex>
      <Flex height={'1em'}>{previewFilename}</Flex>
    </>
  )
}

const GeneralOptions = () => {
  const [filenameSettings, formStatus, formMsg, formHandler] = useFilenameSettingsForm()
  if (!formStatus.isLoaded) return <></>

  const filenameUsecase = new V4FilenameSettingsUsecase(filenameSettings)
  const previewFilename = filenameUsecase.makeFilename({
    account: 'tweetUser',
    tweetId: '1145141919816',
    serial: 2,
    hash: '2vfn8shkjvd98892pR',
    date: new Date(),
  })

  return (
    <form onReset={formHandler.reset} onSubmit={formHandler.submit}>
      <VStack>
        <RichFeatureSwitch
          name="Filename pattern"
          desc="Create sub-directory under the default download directory."
          message={formMsg.filenamePattern}
        >
          <TokenPanel
            pattern={filenameSettings.filenamePattern}
            handleTokenToggle={formHandler.patternTokenToggle}
            previewFilename={previewFilename}
          />
        </RichFeatureSwitch>
        <RichFeatureSwitch
          name="Create sub-directory"
          message={formMsg.directory}
          desc="Create sub-directory under the default download directory."
          isOn={!filenameSettings.noSubDirectory}
          handleClick={formHandler.directorySwitch}
        >
          <Input
            placeholder={DEFAULT_DIRECTORY}
            focusBorderColor={
              formStatus.dataIsChanged ? (formStatus.directoryIsValid ? 'green.300' : 'red.300') : 'blue.300'
            }
            value={filenameSettings.directory}
            onInput={formHandler.directoryInput}
            onChange={formHandler.directoryInput}
            isDisabled={filenameSettings.noSubDirectory}
            isInvalid={!formStatus.directoryIsValid}
          />
        </RichFeatureSwitch>
        <HStack>
          <Button type="reset">Reset</Button>
          <Button type="submit" isDisabled={!Object.values(formStatus).every(v => v)}>
            Save
          </Button>
        </HStack>
      </VStack>
    </form>
  )
}

export default GeneralOptions
