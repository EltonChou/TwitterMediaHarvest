/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import useLocaleVariables from './useLocaleVariables'
import { BiBeer, BiCoffee, BiCoffeeTogo, BiWine } from 'react-icons/bi'
import type { IconType } from 'react-icons/lib'
import { LuCupSoda } from 'react-icons/lu'
import { TbBottle, TbBubbleTea, TbGlassFull, TbTeapot } from 'react-icons/tb'

/** Icon matching the localized "Buy me a <drink>" donation text. */
const useDrinkIcon = () =>
  useLocaleVariables<IconType>({
    fallback: BiCoffeeTogo,
    de: BiBeer,
    es: BiBeer,
    fr: BiWine,
    it: BiCoffee,
    pt: BiCoffee,
    ko: TbBottle,
    pl: TbGlassFull,
    ru: TbTeapot,
    tr: TbTeapot,
    th: LuCupSoda,
    zh: TbBubbleTea,
  })

export default useDrinkIcon
