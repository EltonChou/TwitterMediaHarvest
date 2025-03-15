import { transformer } from '../src/transformer'
import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

test('transformer', async () => {
  const testFile = path.normalize(
    path.resolve(path.dirname(__filename), '..', 'fixtures', 'i18n.ts')
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
