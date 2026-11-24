/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import makeHarvester from '../core'
import { articleHasMedia, canArticleBeAppended } from '../utils/article'
import { isAnonymousMode, isStreamLoaded } from '../utils/checker'
import { revealNsfw } from '../utils/helper'
import observeElement, { isElementObserved } from './observer'
import type { IHarvestObserver, ObserverOptions } from './types'
import { $, $$ } from 'select-dom'

const enum Query {
  Root = 'main',
  Stream = 'section div[id^="urt:"] > ul',
  ShareAction = '[data-engagement-action="share"]',
}

/**
 * The viewer's own action bar holds the only share button outside the thread
 * articles. It shows even when the thread is collapsed.
 */
const getMediaViewerShare = () =>
  $$(`[data-base-ui-portal] ${Query.ShareAction}`).find(
    share => !share.closest('article')
  )

/** A multi-image tweet adds another group (the carousel) without a share button. */
const getMediaViewerBarContainer = () =>
  getMediaViewerShare()?.closest('[role="group"]')?.parentElement

/** Mutations caused by appending our own button. */
const isOwnMutation = (mutations: MutationRecord[]) =>
  mutations.every(
    m =>
      m.removedNodes.length === 0 &&
      [...m.addedNodes].every(
        n => n instanceof HTMLElement && n.classList.contains('harvester')
      )
  )

const getMediaViewer = () =>
  getMediaViewerShare()?.closest<HTMLElement>('[role="presentation"]')

const isStreamObserved = () => {
  const streamEle = $(Query.Stream)
  return streamEle ? isElementObserved(streamEle) : false
}

export default class XMediaObserver implements IHarvestObserver {
  private isInitializeScheduled = false

  constructor(readonly options: ObserverOptions = { autoRevealNsfw: false }) {}

  /** Run `initialize` once per frame, however many observers ask for it. */
  scheduleInitialize() {
    if (this.isInitializeScheduled) return
    this.isInitializeScheduled = true
    requestAnimationFrame(() => {
      this.isInitializeScheduled = false
      this.initialize()
    })
  }

  observeAll() {
    this.observeHead()
    this.observeModal()
    this.observeStream()
  }

  observe() {
    this.observeRoot()
  }

  observeRoot() {
    const options: MutationObserverInit = {
      childList: true,
      subtree: true,
    }

    // Only a new stream needs a full scan. Otherwise check the touched articles:
    // media such as videos mounts after its article.
    const rootMutationCallback: MutationCallback = mutations => {
      if (isOwnMutation(mutations)) return
      if (isStreamLoaded() && !isStreamObserved()) {
        this.scheduleInitialize()
        this.observeAll()
        return
      }

      const articles = new Set<HTMLElement>()
      for (const { target } of mutations) {
        const article = target instanceof Element && target.closest('article')
        if (article instanceof HTMLElement && canArticleBeAppended(article))
          articles.add(article)
      }
      for (const article of articles) {
        if (this.options.autoRevealNsfw) revealNsfw(article)
        if (articleHasMedia(article)) makeHarvester(article)
      }
    }

    observeElement('Root', Query.Root, rootMutationCallback, options)
  }

  initialize() {
    const viewerBar = getMediaViewerBarContainer()
    if (viewerBar) makeHarvester(viewerBar)

    const articles = $$('article')
    for (const article of articles) {
      if (this.options.autoRevealNsfw) revealNsfw(article)
      if (articleHasMedia(article)) makeHarvester(article)
    }
  }

  observeStream() {
    const mutaionCb: MutationCallback = mutations => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (!(addedNode instanceof HTMLElement)) continue

          const mediaBlocks = $$('li', addedNode)
          mediaBlocks.forEach(
            mediaBlock => this.options.autoRevealNsfw && revealNsfw(mediaBlock)
          )

          // A thread item holds several articles.
          for (const article of $$('article', addedNode)) {
            if (this.options.autoRevealNsfw) revealNsfw(article)
            if (articleHasMedia(article)) makeHarvester(article)
          }
        }
      }
    }

    const streamContainer = isAnonymousMode()
      ? $('article')?.closest('ul')
      : $(Query.Stream)
    if (streamContainer) observeElement('Stream', streamContainer, mutaionCb)
  }

  observeHead() {
    // Navigation changes the title. Other `head` children (prefetch links) are noise.
    const options: MutationObserverInit = {
      childList: true,
      characterData: true,
      subtree: true,
    }

    const titleMutationCallback: MutationCallback = () => {
      this.scheduleInitialize()
      this.observeRoot()
    }

    observeElement('Title', 'head > title', titleMutationCallback, options)
  }

  /**
   * The media viewer is a portal under `body`, outside `main`. Its thread is
   * virtualized, so articles remount while scrolling.
   */
  observeModal() {
    // ponytail: rescans all articles, coalesced per frame; scope to the viewer if it shows in profiles.
    const observeViewer = () => {
      const viewer = getMediaViewer()
      if (!viewer) return
      const observer = observeElement(
        'Media Viewer',
        viewer,
        mutations => {
          if (!isOwnMutation(mutations)) this.scheduleInitialize()
        },
        { childList: true, subtree: true }
      )
      // Its thread is already in place: no mutation will announce it.
      if (observer) this.scheduleInitialize()
    }

    // The portal mounts before its thread loads, so watch it until the viewer shows.
    const observePortals = () => {
      observeViewer()
      for (const portal of $$('body > [data-base-ui-portal]'))
        observeElement('Portal', portal, observeViewer, {
          childList: true,
          subtree: true,
        })
    }

    observePortals()
    observeElement('Body', document.body, observePortals)
  }
}
