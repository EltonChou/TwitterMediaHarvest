"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformer = void 0;
const hashStore_1 = require("./hashStore");
const typescript_1 = __importDefault(require("typescript"));
function replaceContextId(expression, transformerCtx) {
    if (typescript_1.default.isStringLiteral(expression)) {
        const digestedHash = (0, hashStore_1.getHashStore)().saveContext(expression.text);
        return transformerCtx.factory.createStringLiteral(digestedHash);
    }
    return expression;
}
function replaceMsgId(expression, transformerCtx) {
    if (typescript_1.default.isStringLiteral(expression)) {
        const digestedHash = (0, hashStore_1.getHashStore)().saveMsgId(expression.text);
        return transformerCtx.factory.createStringLiteral(digestedHash);
    }
    return expression;
}
function replaceI18nArguments(expr, ctx) {
    const [msgIdArg, contextArg, placeholders] = expr.arguments;
    if (msgIdArg !== undefined &&
        contextArg !== undefined &&
        placeholders !== undefined) {
        return typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier(expr.expression.getText()), undefined, [
            replaceMsgId(msgIdArg, ctx),
            replaceContextId(contextArg, ctx),
            placeholders,
        ]);
    }
    if (msgIdArg !== undefined && contextArg !== undefined) {
        return typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier(expr.expression.getText()), undefined, [replaceMsgId(msgIdArg, ctx), replaceContextId(contextArg, ctx)]);
    }
    if (msgIdArg !== undefined) {
        return typescript_1.default.factory.createCallExpression(typescript_1.default.factory.createIdentifier(expr.expression.getText()), undefined, [replaceMsgId(msgIdArg, ctx)]);
    }
    return expr;
}
function isI18nCallExpression(expression) {
    return Array.isArray(expression)
        ? node => expression.some(expr => node.expression.getText().match(expr) !== null)
        : node => node.expression.getText().match(expression) !== null;
}
const transformer = (options) => ctx => node => {
    const visitChild = node => {
        if (typescript_1.default.isCallExpression(node) &&
            isI18nCallExpression(options.config.expressions)(node)) {
            const newExpr = replaceI18nArguments(node, ctx);
            if (newExpr)
                return newExpr;
        }
        return typescript_1.default.visitEachChild(node, visitChild, ctx);
    };
    const visitNode = node => typescript_1.default.visitEachChild(node, visitChild, ctx);
    return typescript_1.default.visitNode(node, visitNode, typescript_1.default.isSourceFile);
};
exports.transformer = transformer;
//# sourceMappingURL=transformer.js.map