import { HamburgerIcon } from '@chakra-ui/icons'
import { Box, Flex, IconButton, Link, useBoolean, useBreakpointValue, VStack } from '@chakra-ui/react'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

type MenuItemProps = {
  name: string
  target: string
  closeMenu: () => void
}

const NavItem = (props: MenuItemProps) => {
  return (
    <Link to={props.target} as={RouterLink} onClick={props.closeMenu}>
      <Box
        pl="12"
        _hover={{ bg: 'rgba(255, 255, 255, 0.33)', textDecoration: 'none' }}
        style={{ transition: 'background 300ms' }}
      >
        {props.name}
      </Box>
    </Link>
  )
}

type NavProps = {
  closeMenu: () => void
}

const Nav = ({ closeMenu }: NavProps) => {
  return (
    <VStack spacing={6} align="normal">
      <NavItem name="General" target="/" closeMenu={closeMenu} />
      <NavItem name="Features" target="/features" closeMenu={closeMenu} />
      <NavItem name="Integrations" target="/integrations" closeMenu={closeMenu} />
      {/* <NavItem name="History" target="/history" />
      <NavItem name="Statistics" target="/statistics" /> */}
      <NavItem name="About" target="/about" closeMenu={closeMenu} />
    </VStack>
  )
}

const SideMenu = () => {
  const [isActive, setActive] = useBoolean(false)
  const menuL = useBreakpointValue({
    base: isActive ? '0px' : '-240px',
    lg: '0px',
  })
  const menuBoarder = useBreakpointValue({
    base: 'unset',
    lg: '1px solid gray',
  })

  return (
    <>
      <Box pos="fixed" top={0} zIndex={'overlay'}>
        <IconButton
          aria-label="Side menu"
          size={'lg'}
          variant="ghost"
          bg="transparent"
          color="white"
          _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
          _active={{ bg: 'rgba(255, 255, 255, 0.2)' }}
          icon={<HamburgerIcon />}
          onClick={() => setActive.on()}
          pos={'absolute'}
          top={0}
        />
        <Box
          height={'full'}
          width={'full'}
          pos={'fixed'}
          bg={'blackAlpha.600'}
          hidden={!isActive}
          onClick={() => setActive.off()}
        ></Box>
      </Box>
      <Flex
        fontSize="2rem"
        direction="column"
        width="240px"
        bg="brand.bg"
        left={menuL}
        borderRight={menuBoarder}
        top="0"
        position={['fixed', 'fixed', 'fixed', 'relative', 'relative']}
        height={'full'}
        zIndex={'modal'}
        style={{
          transition: 'left 200ms',
        }}
      >
        <Box height="150px" />
        <Nav closeMenu={setActive.off} />
      </Flex>
    </>
  )
}

export default SideMenu