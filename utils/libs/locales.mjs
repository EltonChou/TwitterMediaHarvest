import { glob } from 'glob'
import path from 'node:path'
import process from 'node:process'

function isWindows() {
  return process.platform === 'win32'
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
export async function listPoFiles(dir) {
  return glob(path.resolve(dir, '*.po'), {
    dotRelative: true,
    nodir: true,
    windowsPathsNoEscape: isWindows(),
  })
}
