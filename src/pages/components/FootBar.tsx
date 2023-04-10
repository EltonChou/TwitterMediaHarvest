import React from 'react'

import { StarIcon } from '@chakra-ui/icons'
import { Box, BoxProps, Button, HStack, Link, Text } from '@chakra-ui/react'
import Links from '@pages/links'
import { BiCoffeeTogo } from 'react-icons/bi'

const FootBar = (props: BoxProps) => {
  return (
    <Box {...props} fontSize={['1rem', '1rem', '1.5rem']} p={'0.5em'} bg={'brand.blue'}>
      <HStack justify={'center'} spacing={[4, 4, 4, 8]}>
        <Text>Do you like Media Harvest ?</Text>
        <Link href={Links.store} isExternal>
          <Button colorScheme={'brand.yellow'} color={'white'} rightIcon={<StarIcon />}>
            Rate it
          </Button>
        </Link>
        <Text>or</Text>
        <Link href={Links.koFi} isExternal>
          <Button colorScheme={'brand.pink'} color={'white'} rightIcon={<BiCoffeeTogo />}>
            Buy me a coffee
          </Button>
        </Link>
      </HStack>
    </Box>
  )
}

export default FootBar
