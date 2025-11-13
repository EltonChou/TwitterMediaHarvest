"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebextI18nPlugin = void 0;
const hashStore_1 = require("./hashStore");
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = require("glob");
const node_process_1 = __importDefault(require("node:process"));
const path_1 = __importDefault(require("path"));
const schema_utils_1 = require("schema-utils");
const webpack_1 = require("webpack");
const { RawSource } = webpack_1.sources;
class WebextI18nPlugin {
    constructor(options) {
        this.options = options;
        (0, schema_utils_1.validate)({
            type: 'object',
            required: ['poDir'],
            additionalProperties: false,
            properties: {
                poDir: { type: 'string' },
                rawContexts: {
                    oneOf: [
                        {
                            type: 'array',
                            items: {
                                anyof: [{ type: 'string' }, { instanceof: 'RegExp' }],
                            },
                        },
                        { type: 'string' },
                        { instanceof: 'RegExp' },
                    ],
                },
                messageIdMaker: {
                    instanceof: 'Function',
                },
            },
        }, options);
        this.options = options;
        this.hashStore = (0, hashStore_1.getHashStore)();
    }
    isRawContext(context) {
        if (this.options.rawContexts === undefined || context === undefined)
            return false;
        return Array.isArray(this.options.rawContexts)
            ? this.options.rawContexts.some(rawContext => context.match(rawContext) !== null)
            : context.match(this.options.rawContexts) !== null;
    }
    makeMsgId(msgId, context) {
        if (this.options.messageIdMaker)
            return this.options.messageIdMaker(msgId, context);
        return context ? context + '_' + msgId : msgId;
    }
    transformToLocaleMsgId(hashStore) {
        return (msgId, context) => {
            var _a;
            if (context === undefined || context === null)
                return this.makeMsgId((_a = hashStore.getMsgIdHash(msgId)) !== null && _a !== void 0 ? _a : msgId);
            if (this.isRawContext(context)) {
                return this.makeMsgId(msgId, context);
            }
            else {
                const ctxHash = hashStore.getContextHash(context);
                const msgIdHash = hashStore.getMsgIdHash(msgId);
                return this.makeMsgId(msgIdHash !== null && msgIdHash !== void 0 ? msgIdHash : msgId, ctxHash !== null && ctxHash !== void 0 ? ctxHash : context);
            }
        };
    }
    apply(compiler) {
        const pluginName = this.constructor.name;
        const hashStore = this.hashStore;
        compiler.hooks.thisCompilation.tap({ name: pluginName }, compilation => {
            const logger = compilation.getLogger('webext-i18n-plugin');
            compilation.hooks.processAssets.tapPromise({
                name: pluginName,
                stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                additionalAssets: true,
            }, (_unusedAssets) => __awaiter(this, void 0, void 0, function* () {
                logger.log(`Finding po files from ${this.options.poDir}`);
                const localePoMap = new Map();
                const poFiles = yield (0, glob_1.glob)(path_1.default.resolve(this.options.poDir, '*.po'), {
                    windowsPathsNoEscape: isWindows(),
                });
                compilation.fileDependencies.addAll(poFiles);
                for (const file of poFiles) {
                    const locale = parseLocaleName(file);
                    localePoMap.set(locale, file);
                }
                for (const [locale, poFile] of localePoMap.entries()) {
                    logger.log(`Parsing locale: ${locale} from ${poFile}`);
                    const translations = yield readTranslationsFromPo(poFile);
                    const webextTranslationEntries = translations.map(translation => [
                        this.transformToLocaleMsgId(hashStore)(translation.msgId, translation.context),
                        { message: translation.content },
                    ]);
                    const webextTranslations = Object.fromEntries(webextTranslationEntries);
                    const outputFile = path_1.default.posix.join('_locales', locale, 'messages.json');
                    compilation.emitAsset(outputFile, new RawSource(JSON.stringify(webextTranslations)), {
                        javascriptModule: false,
                        sourceFilename: path_1.default.posix.relative(compiler.context, poFile),
                    });
                }
            }));
        });
    }
}
exports.WebextI18nPlugin = WebextI18nPlugin;
function parseLocaleName(poFilename) {
    return path_1.default.basename(poFilename, '.po');
}
function readTranslationsFromPo(poFile) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const poContent = yield promises_1.default.readFile(path_1.default.resolve(poFile));
        const { po } = yield import('gettext-parser');
        const content = po.parse(poContent);
        const translations = [];
        for (const contextObject of Object.values(content.translations)) {
            for (const [msgId, translation] of Object.entries(contextObject)) {
                if (msgId === '')
                    break;
                translations.push({
                    content: (_a = translation.msgstr.at(0)) !== null && _a !== void 0 ? _a : '',
                    msgId: translation.msgid,
                    context: translation.msgctxt,
                });
            }
        }
        return translations;
    });
}
function isWindows() {
    return node_process_1.default.platform === 'win32';
}
//# sourceMappingURL=plugin.js.map