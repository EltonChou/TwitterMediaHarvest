import { getText as i18n } from '#libs/i18n'
import Links from '#pages/links'
import { StarIcon } from '@chakra-ui/icons'
import { Box, Button, HStack, Link, Text } from '@chakra-ui/react'
import React from 'react'
import { BiCoffeeTogo } from 'react-icons/bi'

const FootBar = () => {
  return (
    <Box
      position={'sticky'}
      bottom={0}
      width={'full'}
      fontSize={['1rem', '1rem', '1.5rem']}
      p={'0.5em'}
      bg={'brand.blue'}
    >
      <HStack justify={'center'} spacing={[4, 4, 4, 8]}>
        <Text>{i18n('Do you like Media Harvest?', 'options:footBar')}</Text>
        <Link href={Links.store} _hover={{ textDecoration: 'none' }} isExternal>
          <Button
            colorScheme={'brand.yellow'}
            color={'white'}
            rightIcon={<StarIcon />}
            data-testid="rate-button"
          >
            {i18n('Rate it', 'options:footBar')}
          </Button>
        </Link>
        <Text>{i18n('or', 'options:footBar')}</Text>
        <Link href={Links.koFi} _hover={{ textDecoration: 'none' }} isExternal>
          <Button
            colorScheme={'brand.pink'}
            color={'white'}
            rightIcon={<BiCoffeeTogo />}
            data-testid="coffee-button"
          >
            {i18n('Buy me a coffee', 'options:footBar')}
          </Button>
        </Link>
      </HStack>
    </Box>
  )
}

export default FootBar
