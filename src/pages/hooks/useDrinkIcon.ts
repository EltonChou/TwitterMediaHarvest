/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import useLocaleVariables from './useLocaleVariables'
import { BiCoffee, BiCoffeeTogo, BiWine } from 'react-icons/bi'
import { FaMugHot } from 'react-icons/fa'
import type { IconType } from 'react-icons/lib'
import { LuCupSoda } from 'react-icons/lu'
import { RiBeerFill } from 'react-icons/ri'
import { TbBottle, TbBubbleTea, TbGlassFull } from 'react-icons/tb'

/**
 * Icon matching the localized "Buy me a <drink>" donation text.
 * To pick or replace an icon, search by drink name (e.g. "tea", "beer").
 *
 * @returns Icon for the browser UI locale, or the coffee take-out cup when
 * the locale has no entry.
 * @see [Drink choice per locale](../../../locales/docs/drink.md)
 * @see {@link https://react-icons.github.io/react-icons/search/ | React Icons search}
 */
const useDrinkIcon = () =>
  useLocaleVariables<IconType>({
    fallback: BiCoffeeTogo,
    de: RiBeerFill,
    es: RiBeerFill,
    fr: BiWine,
    it: BiCoffee,
    pt: BiCoffee,
    ko: TbBottle,
    pl: TbGlassFull,
    ru: FaMugHot,
    tr: FaMugHot,
    th: LuCupSoda,
    zh: TbBubbleTea,
  })

export default useDrinkIcon
