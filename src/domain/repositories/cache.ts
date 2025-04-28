/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * Interface for cache repository operations.
 * The lifecycle of items is managed by the cache system.
 *
 * @template T - The type of items to be cached
 */
export interface ICache<T> {
  /**
   * Retrieves an item from the cache by its ID
   * @param cacheId - Unique identifier for the cached item
   * @returns AsyncResult containing the cached item of type T if found
   */

  get(cacheId: string): AsyncResult<T | undefined>
  /**
   * Saves a single item to the cache
   * @param item - The item to be cached
   * @returns Promise resolving to an UnsafeTask representing the save operation
   */
  save(item: T): Promise<UnsafeTask>
  /**
   * Saves multiple items to the cache
   * @param items - Array of items to be cached
   * @returns Promise resolving to an UnsafeTask representing the batch save operation
   */
  saveAll(...items: T[]): Promise<UnsafeTask>
}
