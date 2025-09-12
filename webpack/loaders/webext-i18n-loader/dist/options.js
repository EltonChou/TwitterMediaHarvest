"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = void 0;
const getOptions = (loaderContext) => loaderContext.getOptions({
    type: 'object',
    properties: {
        expressions: {
            anyOf: [
                { type: 'array' },
                { type: 'string' },
                { instanceof: 'RegExp' },
            ],
        },
    },
    additionalProperties: false,
});
exports.getOptions = getOptions;
//# sourceMappingURL=options.js.map