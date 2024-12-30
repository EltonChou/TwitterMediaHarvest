const crypto = require('crypto')
const dayjs = require('dayjs')
const fs = require('fs')
const { GettextExtractor, JsExtractors } = require('gettext-extractor')
const packageInfo = require('../package.json')

const extractor = new GettextExtractor()

extractor
  .createJsParser([
    JsExtractors.callExpression(['_', 'getText', 'i18n'], {
      arguments: {
        text: 0,
        context: 1,
      },
    }),
    JsExtractors.callExpression(['getTextPlural', 'plural'], {
      arguments: {
        text: 1,
        textPlural: 2,
        context: 3,
      },
    }),
  ])
  .parseFilesGlob('src/**/!(*.test).@(js|jsx|ts|tsx)')

extractor.printStats()

const FILENAME = 'locales/template.pot'
const DIGEST_FILENAME = 'locales/template.pot.digest'

const savePot = () =>
  extractor.savePotFile(FILENAME, {
    ...poHeaders,
    'POT-Creation-Date': dayjs().format('YYYY-MM-DD HH:mm:ss ZZ'),
  })

const saveDigest = digest =>
  fs.writeFileSync(DIGEST_FILENAME, digest, { encoding: 'utf-8', flag: 'w' })

/** @type {Partial<import('pofile').IHeaders>} */
const poHeaders = {
  'Project-Id-Version': `${packageInfo.name} (${packageInfo.version})`,
}

const currDigest = crypto
  .createHash('sha256')
  .update(extractor.getPotString(poHeaders))
  .digest('hex')

if (fs.existsSync(DIGEST_FILENAME)) {
  const prevDigest = fs.readFileSync(DIGEST_FILENAME, 'utf-8', 'r')

  console.info('Prev digest\t' + prevDigest)
  console.info('Curr digest\t' + currDigest + '\n')

  if (currDigest !== prevDigest) {
    console.info('Update pot file.')
    savePot()
    saveDigest(currDigest)
  } else {
    console.info('Skip updating due to same digest.')
  }
} else {
  console.info('Create pot file.')
  savePot()
  saveDigest(currDigest)
}
