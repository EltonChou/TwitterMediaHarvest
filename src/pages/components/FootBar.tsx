import { StarIcon } from '@chakra-ui/icons'
import { Box, BoxProps, Button, HStack, Link, Text } from '@chakra-ui/react'
import Links from '@pages/links'
import { i18n } from '@pages/utils'
import React from 'react'
import { BiCoffeeTogo } from 'react-icons/bi'

const FootBar = (props: BoxProps) => {
  return (
    <Box {...props} fontSize={['1rem', '1rem', '1.5rem']} p={'0.5em'} bg={'brand.blue'}>
      <HStack justify={'center'} spacing={[4, 4, 4, 8]}>
        <Text>{i18n('footbar_doYouLike')}</Text>
        <Link href={Links.store} _hover={{ textDecoration: 'none' }} isExternal>
          <Button colorScheme={'brand.yellow'} color={'white'} rightIcon={<StarIcon />}>
            {i18n('footbar_rate')}
          </Button>
        </Link>
        <Text>{i18n('footbar_or')}</Text>
        <Link href={Links.koFi} _hover={{ textDecoration: 'none' }} isExternal>
          <Button colorScheme={'brand.pink'} color={'white'} rightIcon={<BiCoffeeTogo />}>
            {i18n('footbar_buyMeCoffee')}
          </Button>
        </Link>
      </HStack>
    </Box>
  )
}

export default FootBar
