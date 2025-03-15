import type { LoaderOptions } from '../src/options.js'
import { Volume, createFsFromVolume } from 'memfs'
import path from 'path'
import webpack from 'webpack'

const compiler = (fixture: string, options: LoaderOptions) => {
  const webpackCompiler = webpack({
    context: path.dirname(__filename),
    entry: fixture,
    output: {
      path: path.resolve(path.dirname(__filename)),
      filename: 'bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: path.resolve(process.cwd(), 'dist', 'index.js'),
              options,
            },
            { loader: 'ts-loader' },
          ],
        },
      ],
    },
  })

  webpackCompiler.outputFileSystem = createFsFromVolume(
    new Volume()
  ) as webpack.OutputFileSystem
  webpackCompiler.outputFileSystem.join = path.join.bind(path)

  return new Promise<webpack.Stats | undefined>((resolve, reject) => {
    webpackCompiler.run((err, stats) => {
      if (err) reject(err)
      if (stats && stats.hasErrors()) reject(stats.toJson().errors)

      resolve(stats)
    })
  })
}

test('test', async () => {
  const stats = await compiler(
    path.resolve(path.dirname(__filename), '..', 'fixtures', 'i18n.ts'),
    {
      expressions: ['i18n', /getText/],
    }
  )

  expect(stats).toBeDefined()
  if (stats) {
    const output = stats.toJson({ source: true })?.modules?.at(0)?.source
    expect(output).toMatchSnapshot()
  }
}, 60000)
