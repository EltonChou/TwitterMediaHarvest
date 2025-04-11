import type { LoaderOptions } from './options.js'
import { getOptions } from './options.js'
import { transformer } from './transformer.js'
import path from 'path'
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map'
import ts from 'typescript'
import type { LoaderDefinitionFunction } from 'webpack'

function updateSourceMap(parsedSourceMap: RawSourceMap) {
  let generator: SourceMapGenerator
  SourceMapConsumer.with(parsedSourceMap, null, consumer => {
    generator = new SourceMapGenerator({
      file: parsedSourceMap.file,
      sourceRoot: parsedSourceMap.sourceRoot,
    })

    // Copy original mappings
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
      })
    })

    // Add source content
    consumer.sources.forEach(source => {
      const content = consumer.sourceContentFor(source)
      if (content) {
        generator.setSourceContent(source, content)
      }
    })

    consumer.destroy()
  })

  return generator!
}

/**
 * TODO: Try to make this loader can be placed in front or behind `ts-loader`.
 * If the loader is placed in front, it should transforme code only.
 * If the loader is placed behind, it should transform code and update sourcemap.
 **/
const loader: LoaderDefinitionFunction<LoaderOptions> = function loader(
  content,
  sourceMap
) {
  const callback = this.async()
  const logger = this.getLogger('i18n-loader')
  const options = getOptions(this)

  const tsConfig = ts.readConfigFile(
    path.resolve(process.cwd(), 'tsconfig.json'),
    ts.sys.readFile
  )

  if (tsConfig.error) {
    logger.error(tsConfig.error)
    return callback(new Error('Failed to load typescript configuration file.'))
  }

  const srcFile = ts.createSourceFile(
    'temp',
    content,
    tsConfig.config.compilerOptions.target,
    true
  )
  const result = ts.transform([srcFile], [transformer({ config: options })])
  const transformedContent = result.transformed.at(0)
  const outputContent = transformedContent
    ? ts.createPrinter().printFile(transformedContent)
    : content

  if (sourceMap) {
    const parsedSourceMap: RawSourceMap =
      typeof sourceMap === 'string' ? JSON.parse(sourceMap) : sourceMap

    const sourceMapGenerator = updateSourceMap(parsedSourceMap)
    // Return modified source and updated sourcemap
    if (sourceMapGenerator) {
      callback(null, outputContent, sourceMapGenerator.toJSON())
    } else {
      callback(null, outputContent)
    }
  } else {
    return callback(null, outputContent)
  }
}

export default loader
