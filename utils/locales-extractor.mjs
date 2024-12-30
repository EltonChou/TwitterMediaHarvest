import { GettextExtractor, JsExtractors } from 'gettext-extractor'

const extractor = new GettextExtractor()

extractor
  .createJsParser([
    JsExtractors.callExpression(['_', 'getText'], {
      arguments: {
        text: 0,
        context: 1,
      },
    }),
    JsExtractors.callExpression('getTextPlural', {
      arguments: {
        text: 1,
        textPlural: 2,
        context: 3,
      },
    }),
  ])
  .parseFilesGlob('src/**/!(*.test).@(js|jsx|ts|tsx)')

extractor.savePotFile('locales/template.pot')
