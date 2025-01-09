import { getHashStore } from './hashStore.js'
import path from 'path'
import ts from 'typescript'
import type { LoaderDefinitionFunction } from 'webpack'

function replaceContextId<T extends ts.Expression>(
  expression: T,
  transformerCtx: ts.TransformationContext
) {
  return ts.isStringLiteral(expression)
    ? transformerCtx.factory.createStringLiteral(
        getHashStore().saveContext(expression.getText())
      )
    : expression
}

function replaceMsgId<T extends ts.Expression>(
  expression: T,
  transformerCtx: ts.TransformationContext
) {
  return ts.isStringLiteral(expression)
    ? transformerCtx.factory.createStringLiteral(
        getHashStore().saveMsgId(expression.getText())
      )
    : expression
}

function replaceI18nArguments(
  expr: ts.CallExpression,
  ctx: ts.TransformationContext
) {
  const [msgIdArg, contextArg, placeholders] = expr.arguments

  if (
    msgIdArg !== undefined &&
    contextArg !== undefined &&
    placeholders !== undefined
  ) {
    return ts.factory.createCallExpression(
      ts.factory.createIdentifier(expr.expression.getText()),
      undefined,
      [
        replaceMsgId(msgIdArg, ctx),
        replaceContextId(contextArg, ctx),
        placeholders,
      ]
    )
  }

  if (msgIdArg !== undefined && contextArg !== undefined) {
    return ts.factory.createCallExpression(
      ts.factory.createIdentifier(expr.expression.getText()),
      undefined,
      [replaceMsgId(msgIdArg, ctx), replaceContextId(contextArg, ctx)]
    )
  }

  if (msgIdArg !== undefined) {
    return ts.factory.createCallExpression(
      ts.factory.createIdentifier(expr.expression.getText()),
      undefined,
      [replaceMsgId(msgIdArg, ctx)]
    )
  }

  return expr
}

export function isI18nCallExpression(
  expression: LoaderOptions['expression']
): (node: ts.CallExpression) => boolean {
  return Array.isArray(expression)
    ? node =>
        expression.some(expr => node.expression.getText().match(expr) !== null)
    : node => node.expression.getText().match(expression) !== null
}

const transformer =
  (options: LoaderOptions): ts.TransformerFactory<ts.SourceFile> =>
  ctx =>
  node => {
    const visitChild: ts.Visitor<ts.Node, ts.Node> = node => {
      if (
        ts.isCallExpression(node) &&
        isI18nCallExpression(options.expression)(node)
      ) {
        const newExpr = replaceI18nArguments(node, ctx)
        if (newExpr) return newExpr
      }
      return ts.visitEachChild(node, visitChild, ctx)
    }

    const visitNode: ts.Visitor<ts.Node, ts.Node> = node =>
      ts.visitEachChild(node, visitChild, ctx)

    return ts.visitNode(node, visitNode, ts.isSourceFile)
  }

export type LoaderOptions = {
  expression: string | RegExp | (RegExp | string)[]
}

const loader: LoaderDefinitionFunction<LoaderOptions> = function loader(
  content,
  _map,
  _meta
) {
  const callback = this.async()
  const tsConfig = ts.readConfigFile(
    path.resolve(process.cwd(), 'tsconfig.json'),
    ts.sys.readFile
  )
  const logger = this.getLogger('i18n-loader')

  if (tsConfig.error) {
    logger.error(tsConfig.error)
    return callback(new Error('Failed to load typescript configuration file.'))
  }

  const options = this.getOptions({
    type: 'object',
    properties: {
      expression: {
        anyOf: [
          { type: 'array' },
          { type: 'string' },
          { instanceof: 'RegExp' },
        ],
      },
    },
    additionalProperties: false,
  })

  const srcFile = ts.createSourceFile(
    'temp',
    content,
    tsConfig.config.compilerOptions.target,
    true
  )
  const result = ts.transform([srcFile], [transformer(options)])
  const transformedContent = result.transformed.at(0)

  return callback(
    null,
    transformedContent
      ? ts.createPrinter().printFile(transformedContent)
      : content
  )
}

export default loader
