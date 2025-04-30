/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface ISettingsRepository<Settings> {
  get(): Promise<Settings>
  save(settings: Partial<Settings>): Promise<void>
  reset(): Promise<void>
  getDefault(): Settings
}

export interface ISettingsVORepository<Settings> {
  get(): Promise<Settings>
  save(settings: Settings): Promise<void>
  reset(): Promise<void>
  getDefault(): Settings
}
