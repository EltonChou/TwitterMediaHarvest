"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const options_js_1 = require("./options.js");
const transformer_js_1 = require("./transformer.js");
const path_1 = __importDefault(require("path"));
const source_map_1 = require("source-map");
const typescript_1 = __importDefault(require("typescript"));
function updateSourceMap(parsedSourceMap) {
    let generator;
    source_map_1.SourceMapConsumer.with(parsedSourceMap, null, consumer => {
        generator = new source_map_1.SourceMapGenerator({
            file: parsedSourceMap.file,
            sourceRoot: parsedSourceMap.sourceRoot,
        });
        consumer.eachMapping(mapping => {
            generator.addMapping({
                generated: {
                    line: mapping.generatedLine,
                    column: mapping.generatedColumn,
                },
                original: {
                    line: mapping.originalLine,
                    column: mapping.originalColumn,
                },
                source: mapping.source,
                name: mapping.name,
            });
        });
        consumer.sources.forEach(source => {
            const content = consumer.sourceContentFor(source);
            if (content) {
                generator.setSourceContent(source, content);
            }
        });
        consumer.destroy();
    });
    return generator;
}
const loader = function loader(content, sourceMap) {
    const callback = this.async();
    const logger = this.getLogger('i18n-loader');
    const options = (0, options_js_1.getOptions)(this);
    const tsConfig = typescript_1.default.readConfigFile(path_1.default.resolve(process.cwd(), 'tsconfig.json'), typescript_1.default.sys.readFile);
    if (tsConfig.error) {
        logger.error(tsConfig.error);
        return callback(new Error('Failed to load typescript configuration file.'));
    }
    const srcFile = typescript_1.default.createSourceFile('temp', content, tsConfig.config.compilerOptions.target, true);
    const result = typescript_1.default.transform([srcFile], [(0, transformer_js_1.transformer)({ config: options })]);
    const transformedContent = result.transformed.at(0);
    const outputContent = transformedContent
        ? typescript_1.default.createPrinter().printFile(transformedContent)
        : content;
    if (sourceMap) {
        const parsedSourceMap = typeof sourceMap === 'string' ? JSON.parse(sourceMap) : sourceMap;
        const sourceMapGenerator = updateSourceMap(parsedSourceMap);
        if (sourceMapGenerator) {
            callback(null, outputContent, sourceMapGenerator.toJSON());
        }
        else {
            callback(null, outputContent);
        }
    }
    else {
        return callback(null, outputContent);
    }
};
exports.default = loader;
//# sourceMappingURL=loader.js.map