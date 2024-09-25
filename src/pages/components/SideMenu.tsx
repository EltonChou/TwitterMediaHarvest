import { i18n } from '#pages/utils'
import { HamburgerIcon } from '@chakra-ui/icons'
import {
  Box,
  Flex,
  IconButton,
  Link,
  VStack,
  useBoolean,
  useBreakpointValue,
} from '@chakra-ui/react'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

interface MenuItemProps extends TestableComponent {
  name: string
  target: string
  closeMenu: () => void
}

const NavItem = (props: MenuItemProps) => {
  return (
    <Link
      to={props.target}
      as={RouterLink}
      onClick={props.closeMenu}
      _hover={{ textDecoration: 'none' }}
      data-testid={props.testId}
    >
      <Box
        p="0.5em 0 0.5em 1.5em"
        _hover={{ bg: 'rgba(255, 255, 255, 0.33)' }}
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
      <NavItem
        name={i18n('options_sidemenu_general')}
        target="/"
        closeMenu={closeMenu}
        testId="nav-item-general"
      />
      <NavItem
        name={i18n('options_sidemenu_features')}
        target="/features"
        closeMenu={closeMenu}
        testId="nav-item-features"
      />
      <NavItem
        name={i18n('options_sidemenu_integrations')}
        target="/integrations"
        closeMenu={closeMenu}
        testId="nav-item-integrations"
      />
      <NavItem
        name={i18n('options_sidemenu_history')}
        target="/history"
        closeMenu={closeMenu}
        testId="nav-item-history"
      />
      {/* <NavItem name="Statistics" target="/statistics" /> */}
      <NavItem
        name={i18n('options_sidemenu_about')}
        target="/about"
        closeMenu={closeMenu}
        testId="nav-item-about"
      />
    </VStack>
  )
}

const SideMenu = () => {
  const [isActive, setActive] = useBoolean(false)

  return (
    <>
      <Box pos="fixed" top={0} zIndex={'overlay'}>
        <Flex
          pos={'fixed'}
          top={0}
          bg={'brand.bg'}
          width={'full'}
          display={useBreakpointValue({
            base: 'inherit',
            lg: 'none',
          })}
        >
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
            data-testid="side-menu-burger"
          />
        </Flex>
        <Box
          height={'full'}
          width={'full'}
          pos={'fixed'}
          bg={'blackAlpha.600'}
          style={{ transition: 'background 300ms' }}
          hidden={!isActive}
          onClick={() => setActive.off()}
          data-testid="side-menu-dimmed"
        ></Box>
      </Box>
      <Flex
        fontSize={'1.5rem'}
        direction="column"
        width="240px"
        bg="brand.bg"
        left={useBreakpointValue({
          base: isActive ? '0px' : '-240px',
          lg: '0px',
        })}
        borderRight={useBreakpointValue({
          base: 'unset',
          lg: '1px solid gray',
        })}
        top="0"
        position={['fixed', 'fixed', 'fixed', 'relative', 'relative']}
        height={'full'}
        zIndex={'modal'}
        style={{
          transition: 'left 200ms',
        }}
        overflowX={'hidden'}
        overflowY={'auto'}
      >
        <Box height="150px" />
        <Nav closeMenu={setActive.off} />
      </Flex>
    </>
  )
}

export default SideMenu
