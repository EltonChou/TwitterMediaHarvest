import { Box, Flex, Link, VStack } from '@chakra-ui/react'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

type MenuItemProps = {
  name: string
  target: string
}

const NavItem = (props: MenuItemProps) => {
  return (
    <Link to={props.target} as={RouterLink}>
      <Box pl="12" _hover={{ bg: 'rgba(255, 255, 255, 0.33)' }} style={{ transition: 'background 300ms' }}>
        {props.name}
      </Box>
    </Link>
  )
}

const Nav = () => {
  return (
    <VStack spacing={6} align="normal">
      <NavItem name="General" target="/" />
      <NavItem name="Features" target="/features" />
      <NavItem name="Integrations" target="/integrations" />
      {/* <NavItem name="History" target="/history" />
      <NavItem name="Statistics" target="/statistics" /> */}
      <NavItem name="About" target="/about" />
    </VStack>
  )
}

const SideMenu = () => {
  return (
    <Flex
      fontSize="2rem"
      direction="column"
      width="240px"
      borderRight="1px solid gray"
      left={['-240px', '-240px', '-240px', '0', '0']}
      top="0"
      position={['fixed', 'fixed', 'fixed', 'relative', 'relative']}
      height={'full'}
    >
      <Box height="150px" />
      <Nav />
    </Flex>
  )
}

export default SideMenu
