import { transformer } from '../src/transformer'
import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

test('transformer', async () => {
  const testFile = path.normalize(
    path.resolve(
      path.dirname(__filename),
      '..',
      'integrated_tests',
      'fixtures',
      'i18n.ts'
    )
  )

  const content = await fs.readFile(testFile, { encoding: 'utf-8', flag: 'r' })

  const srcFile = ts.createSourceFile(
    'temp',
    content,
    ts.ScriptTarget.ESNext,
    true
  )
  const result = ts.transform(
    [srcFile],
    [transformer({ config: { expressions: ['i18n', '_', 'gettext'] } })]
  )
  const [transformedContent] = result.transformed

  expect(transformedContent).toBeDefined()

  const outputContent = transformedContent
    ? ts.createPrinter().printFile(transformedContent)
    : content

  expect(outputContent).toMatchSnapshot('transformed')
})

describe('call expression matching', () => {
  const transformSource = (
    source: string,
    expressions: (string | RegExp)[]
  ) => {
    const srcFile = ts.createSourceFile(
      'temp',
      source,
      ts.ScriptTarget.ESNext,
      true
    )
    const [transformed] = ts.transform(srcFile, [
      transformer({ config: { expressions } }),
    ]).transformed

    return ts.createPrinter().printFile(transformed as ts.SourceFile)
  }

  it.each([
    ['["a_b"].join(",")', '","'],
    ['foo_bar("keep")', '"keep"'],
    ['obj.i18n("keep")', '"keep"'],
    ['i18nLocalize("keep")', '"keep"'],
  ])('should only match the exact name of string: %s', (source, literal) => {
    expect(transformSource(source, ['i18n', '_'])).toContain(literal)
  })

  it('should transform the call with the exact name', () => {
    expect(transformSource('i18n("msg")', ['i18n'])).not.toContain('"msg"')
  })

  it('should keep matching by pattern with RegExp', () => {
    expect(transformSource('gettextFoo("msg")', [/^gettext/])).not.toContain(
      '"msg"'
    )
  })
})
