/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * Safari ignores `"world": "MAIN"` on content scripts, so `inject.js` would
 * run in the isolated world and never see the page's own XHR/fetch calls.
 * On Safari this loader runs at `document_start` and adds `inject.js` to the
 * page as a script tag instead. `inject.js` talks to `main.js` through
 * `document` CustomEvents, which cross between the two worlds.
 */
import { runtime } from 'webextension-polyfill'

const script = document.createElement('script')
script.src = runtime.getURL('inject.js')
script.async = false
script.addEventListener('load', () => script.remove())
;(document.head ?? document.documentElement).append(script)
