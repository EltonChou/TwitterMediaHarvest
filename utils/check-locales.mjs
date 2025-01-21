#!/usr/bin/env node
/* eslint-disable no-console */
// @ts-check
import chalk from 'chalk'
import gettextParser from 'gettext-parser'
import { glob } from 'glob'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

/**
 * Web-extension locale message object
 * @typedef {Object} WebExtLocaleMessage
 * @property {string} message Content
 */

/**
 * Web-extension locale object
 * @typedef {Record<string, WebExtLocaleMessage> } WebExtLocale
 */

/**
 * @typedef {Record<string, Set<string>>} PoCollection
 */

/**
 * @param {string} filepath
 * @returns {Promise<PoCollection>}
 */
async function extractPoCollection(filepath) {
  const po = await fs.readFile(path.resolve(filepath))
  const content = gettextParser.po.parse(po)

  /** @type {PoCollection} */
  const collection = {}
  for (const [context, contextObject] of Object.entries(content.translations)) {
    for (const [msgId, _translation] of Object.entries(contextObject)) {
      if (msgId === '') break
      if (Object.keys(collection).includes(context)) {
        collection[context].add(msgId)
      } else {
        collection[context] = new Set([msgId])
      }
    }
  }

  return collection
}

function isWindows() {
  return process.platform === 'win32'
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listPoFiles(dir) {
  return glob(path.resolve(dir, '*.po'), {
    dotRelative: true,
    nodir: true,
    windowsPathsNoEscape: isWindows(),
  })
}

/**
 * @typedef {Object} Diff
 * @property {'plus' | 'minus'} type
 * @property {string} name Name of target
 */

/**
 * @typedef {Object} LocaleDiff
 * @property {Diff[]} contextDiffs List of context differences.
 * @property {Record<string, Diff[]>} diffs List of msgId differences in context.
 */

/**
 * @template {string | number} T
 * @param {Set<T>} set
 * @returns {(targetRecord: Set<T>) => Diff[]} Diffs is sorted by name.
 */
function compareSet(set) {
  return targetSet => {
    // Get plus diffs
    const plusDiffs = set
      .difference(targetSet)
      .values()
      .map(v => /** @type {Diff} */ ({ type: 'plus', name: v }))

    // Get minus diffs
    const minusDiffs = targetSet
      .difference(set)
      .values()
      .map(v => /** @type {Diff} */ ({ type: 'minus', name: v }))

    return [...plusDiffs, ...minusDiffs].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0
    )
  }
}

/**
 * @param {LocaleDiff} localeDiffs
 * @returns {boolean}
 */
function isQualifiedContext(localeDiffs) {
  return localeDiffs.contextDiffs.length === 0
}

/**
 * @param {LocaleDiff} localeDiffs
 * @returns {boolean}
 */
function isQualifiedMsgIds(localeDiffs) {
  return Object.keys(localeDiffs.diffs).length === 0
}

/**
 * @param {number} layer
 * @returns {string}
 */
function msgLayer(layer) {
  return '\t'.repeat(layer)
}

/**
 *
 * @param {Diff['type']} type
 * @returns {(diff: Diff) => boolean}
 */
function byDiffType(type) {
  return diff => diff.type === type
}

/**
 * @param {Diff} diff
 * @returns {string}
 */
function toDiffName(diff) {
  return diff.name
}

/**
 * @param {string} ctx
 * @returns {(diff: Diff) => string}
 */
function toDiffNameWithCtx(ctx) {
  return diff => `[${ctx}]${diff.name}`
}

async function main() {
  let EXIT_CODE = 0
  const unqualify = () => (EXIT_CODE = 1)
  const templateCollection = await extractPoCollection('./locales/template.pot')
  const poFiles = await listPoFiles('./locales')

  const localeCollection = await getAllPoCollection(poFiles)

  /** @type {Record<string, LocaleDiff>} */
  const localesDiffs = {}
  for (const [locale, collection] of Object.entries(localeCollection)) {
    const collectionCtxSet = new Set(Object.keys(collection))
    const targetCollectionCtxSet = new Set(Object.keys(templateCollection))
    // const intersectionCtxs = collectionCtxSet.intersection(targetCollectionCtxSet)

    localesDiffs[locale] = {
      contextDiffs: compareSet(collectionCtxSet)(targetCollectionCtxSet),
      diffs: Object.fromEntries(
        collectionCtxSet
          .values()
          .map(
            ctx =>
              /** @type {[string, Diff[]]} */ ([
                ctx,
                compareSet(collection[ctx] ?? new Set())(
                  templateCollection[ctx] ?? new Set()
                ),
              ])
          )
          .filter(([_ctx, diffs]) => diffs.length > 0)
      ),
    }
  }

  for (const [locale, diffs] of Object.entries(localesDiffs)) {
    const plusCtx = diffs.contextDiffs
      .filter(byDiffType('plus'))
      .map(toDiffName)
    const minusCtx = diffs.contextDiffs
      .filter(byDiffType('minus'))
      .map(toDiffName)

    const plusIds = Object.entries(diffs.diffs).reduce(
      (arr, [ctx, diffs]) =>
        arr.concat(
          diffs.filter(byDiffType('plus')).map(toDiffNameWithCtx(ctx))
        ),
      /** @type {string[]} */ ([])
    )
    const minusIds = Object.entries(diffs.diffs).reduce(
      (arr, [ctx, diffs]) =>
        arr.concat(
          diffs.filter(byDiffType('minus')).map(toDiffNameWithCtx(ctx))
        ),
      /** @type {string[]} */ ([])
    )

    console.info(chalk.blue(locale))

    console.info(msgLayer(1), 'msgcontext')
    if (isQualifiedContext(diffs)) {
      console.info(msgLayer(2), chalk.bgCyan.bold('PASS'))
    } else {
      unqualify()

      if (plusCtx.length > 0)
        console.info(
          msgLayer(2) +
            chalk.green('+') +
            '\t' +
            chalk.green(plusCtx.join('\n' + msgLayer(3)))
        )
      if (minusCtx.length > 0)
        console.info(
          msgLayer(2) +
            chalk.red('-') +
            '\t' +
            chalk.red(minusCtx.join('\n' + msgLayer(3)))
        )
    }

    console.info(msgLayer(1), 'msgid ([msgcontext]msgid)')
    if (isQualifiedMsgIds(diffs)) {
      console.info(msgLayer(2), chalk.bgCyan.bold('PASS'))
    } else {
      unqualify()

      if (plusIds.length > 0)
        console.info(
          msgLayer(2) +
            chalk.green('+') +
            '\t' +
            chalk.green(plusIds.join('\n' + msgLayer(3)))
        )
      if (minusIds.length > 0)
        console.info(
          msgLayer(2) +
            chalk.red('-') +
            '\t' +
            chalk.red(minusIds.join('\n' + msgLayer(3)))
        )
    }
  }

  process.exit(EXIT_CODE)
}

await main()

/**
 *
 * @param {string[]} poFiles
 * @returns {Promise<Record<string, PoCollection>>}
 */
async function getAllPoCollection(poFiles) {
  /** @type {Record<string, PoCollection>} */
  const localeCollection = {}

  for (const poFile of poFiles) {
    const locale = path.parse(poFile).name
    localeCollection[locale] = await extractPoCollection(poFile)
  }

  return localeCollection
}
