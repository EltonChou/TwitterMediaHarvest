"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformer = exports.WebextI18nPlugin = void 0;
const loader_1 = __importDefault(require("./loader"));
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "WebextI18nPlugin", { enumerable: true, get: function () { return plugin_1.WebextI18nPlugin; } });
var transformer_1 = require("./transformer");
Object.defineProperty(exports, "transformer", { enumerable: true, get: function () { return transformer_1.transformer; } });
exports.default = loader_1.default;
//# sourceMappingURL=index.js.map