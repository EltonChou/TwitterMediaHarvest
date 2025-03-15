import type { LoaderOptions } from './options.js'
import { getOptions } from './options.js'
import { transformer } from './transformer.js'
import path from 'path'
import ts from 'typescript'
import type { LoaderDefinitionFunction } from 'webpack'

/**
 * TODO: Try to make this loader can be placed in front or behind `ts-loader`.
 * If the loader is placed in front, it should transforme code only.
 * If the loader is placed behind, it should transform code and update sourcemap.
 **/
const loader: LoaderDefinitionFunction<LoaderOptions> = function loader(
  content
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

  return callback(null, outputContent)
}

export default loader
