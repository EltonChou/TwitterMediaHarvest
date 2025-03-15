import { getHashStore } from './hashStore'
import { LoaderOptions } from './options'
import ts from 'typescript'

function replaceContextId<T extends ts.Expression>(
  expression: T,
  transformerCtx: ts.TransformationContext
) {
  if (ts.isStringLiteral(expression)) {
    const digestedHash = getHashStore().saveContext(expression.text)

    return transformerCtx.factory.createStringLiteral(digestedHash)
  }

  return expression
}

function replaceMsgId<T extends ts.Expression>(
  expression: T,
  transformerCtx: ts.TransformationContext
) {
  if (ts.isStringLiteral(expression)) {
    const digestedHash = getHashStore().saveMsgId(expression.text)

    return transformerCtx.factory.createStringLiteral(digestedHash)
  }

  return expression
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

function isI18nCallExpression(
  expression: LoaderOptions['expressions']
): (node: ts.CallExpression) => boolean {
  return Array.isArray(expression)
    ? node =>
        expression.some(expr => node.expression.getText().match(expr) !== null)
    : node => node.expression.getText().match(expression) !== null
}

type TransformerOptions = {
  config: LoaderOptions
}

export const transformer =
  (options: TransformerOptions): ts.TransformerFactory<ts.SourceFile> =>
  ctx =>
  node => {
    const visitChild: ts.Visitor<ts.Node, ts.Node> = node => {
      if (
        ts.isCallExpression(node) &&
        isI18nCallExpression(options.config.expressions)(node)
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
