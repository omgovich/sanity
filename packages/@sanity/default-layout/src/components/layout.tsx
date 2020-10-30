import {Box, Flex, Theme} from '@sanity/ui'
import absolutes from 'all:part:@sanity/base/absolutes'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import {RouteScope, useRouterState} from 'part:@sanity/base/router'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {Sidecar} from '../lib/__experimental_sidecar'
import {getNewDocumentModalActions} from '../lib/new-document'
import {getOrderedTools} from '../lib/tool'
import {CreateDocumentDialog} from './createDocumentDialog'
import {Navbar} from './navbar'
import {SchemaErrorReporter} from './schemaErrors'
import {SideMenu} from './sideMenu'
import {RenderTool} from './tool'

const Root = styled(Flex)`
  height: 100%;

  @media (min-width: ${({theme}) => theme.media[0]}) {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
`

const ToolContainer = styled(Box)`
  position: relative;
  height: 100%;
  margin-top: 0;
  margin-left: env(safe-area-inset-left);
  margin-right: env(safe-area-inset-right);

  @media (min-width: ${({theme}) => theme.media[0]}) {
    overflow: auto;
  }
`

const NavbarContainer = styled.div`
  z-index: 9999;
  position: relative;
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`

const loadingScreen = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`

const LoadingScreenContainer = styled.div`
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  opacity: 1;
  transition: opacity 0.5s linear;
  z-index: 5000;
  animation-name: ${loadingScreen};
  animation-duration: 1s;
  animation-delay: 1s;
`

const SidecarContainer = styled.div(({theme}: {theme: Theme}) => {
  const {media} = theme

  return css`
    &:empty {
      display: none;
    }

    @media (max-width: ${media[0] - 1}px) {
      display: none;
    }
  `
})

export function Layout() {
  const tools = getOrderedTools()
  const routerState = useRouterState()
  const [createMenuIsOpen, setCreateMenuIsOpen] = useState(false)
  const [sidemenuIsOpen, setSidemenuIsOpen] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
  const [searchIsOpen, setSearchIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const loadingScreenElementRef = useRef<HTMLDivElement | null>(null)

  const handleAnimationEnd = useCallback(() => setShowLoadingScreen(false), [])
  const handleCreateButtonClick = useCallback(() => setCreateMenuIsOpen(val => !val), [])
  const handleActionModalClose = useCallback(() => setCreateMenuIsOpen(false), [])
  const handleSidemenuToggle = useCallback(() => setSidemenuIsOpen(val => !val), [])
  const handleSwitchTool = useCallback(() => setSidemenuIsOpen(false), [])
  const handleSearchOpen = useCallback(() => setSearchIsOpen(true), [])
  const handleSearchClose = useCallback(() => setSearchIsOpen(false), [])

  const handleClickCapture = useCallback(
    event => {
      // Do not handle click if the event is not within Layout (portals)
      const rootTarget = event.target.closest('[data-sanity-layout]')
      if (!rootTarget) return

      if (sidemenuIsOpen) {
        // Close SideMenu if the user clicks outside
        const menuTarget = event.target.closest('[data-sanity-side-menu-container]')
        if (!menuTarget) {
          event.preventDefault()
          event.stopPropagation()
          handleSidemenuToggle()
        }
      }
    },
    [handleSidemenuToggle, sidemenuIsOpen]
  )

  // Subscribe to `animationend`
  useEffect(() => {
    const loadingScreenElement = loadingScreenElementRef.current

    if (loadingScreenElement && showLoadingScreen) {
      loadingScreenElement.addEventListener('animationend', handleAnimationEnd, false)
    }

    return () => {
      if (loadingScreenElement) {
        loadingScreenElement.removeEventListener('animationend', handleAnimationEnd, false)
      }
    }
  }, [handleAnimationEnd, showLoadingScreen])

  // Set loaded state after first render
  useEffect(() => {
    if (!loaded) setLoaded(true)
  }, [loaded])

  const loadingScreenHidden = loaded || document.visibilityState === 'hidden'

  return (
    <SchemaErrorReporter>
      {() => (
        <Root data-sanity-layout="" direction="column" onClickCapture={handleClickCapture}>
          {showLoadingScreen && (
            <LoadingScreenContainer hidden={loadingScreenHidden} ref={loadingScreenElementRef}>
              <AppLoadingScreen text="Restoring Sanity" />
            </LoadingScreenContainer>
          )}

          <NavbarContainer>
            <Navbar
              tools={tools}
              createMenuIsOpen={createMenuIsOpen}
              onCreateButtonClick={handleCreateButtonClick}
              onToggleMenu={handleSidemenuToggle}
              onSwitchTool={handleSwitchTool}
              searchIsOpen={searchIsOpen}
              onSearchOpen={handleSearchOpen}
              onSearchClose={handleSearchClose}
            />
          </NavbarContainer>

          <div data-sanity-side-menu-container="">
            <SideMenu
              activeToolName={routerState?.tool}
              onClose={handleSidemenuToggle}
              onSwitchTool={handleSwitchTool}
              open={sidemenuIsOpen}
              tools={tools}
            />
          </div>

          <Flex flex={1}>
            <ToolContainer flex={1}>
              <RouteScope scope={routerState?.tool}>
                <RenderTool tool={routerState?.tool} />
              </RouteScope>
            </ToolContainer>

            <SidecarContainer>
              <Sidecar />
            </SidecarContainer>
          </Flex>

          {createMenuIsOpen && (
            <CreateDocumentDialog
              onClose={handleActionModalClose}
              actions={getNewDocumentModalActions()}
            />
          )}

          {absolutes.map((Abs, i) => (
            <Abs key={String(i)} />
          ))}
        </Root>
      )}
    </SchemaErrorReporter>
  )
}