const { resolve } = require('node:path')
const nodeExternals = require('webpack-node-externals')
const { AvailableConfigs, ConfigResolver } = require('./schema/webpack.schema.cjs')

const isProduction = process.env.NODE_ENV === 'production'

const configs = AvailableConfigs.parse({
  cjs: { chunk: 'index.cjs', name: undefined, type: 'commonjs', emitDts: false },
  esm: { chunk: 'index.esm', name: undefined, type: 'module', emitDts: true },
  iife: { chunk: 'index.iife', name: 'VueClassComponent', type: 'window', emitDts: false }
})

const targetConfig = ConfigResolver.implement(config => ({
  mode: isProduction ? 'production' : 'development',
  entry: { [configs[config].chunk]: './src/index.ts' },
  output: {
    path: resolve(__dirname, 'dist'),
    library: {
      name: configs[config].name,
      type: configs[config].type
    }
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/ui,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
        options: {
          configFile: 'tsconfig.build.json',
          compilerOptions: {
            declaration: configs[config].emitDts
          }
        }
      }
    ]
  },
  experiments: { outputModule: true },
  externalsPresets: { node: true },
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  devtool: isProduction ? 'eval-source-map' : 'source-map'
}))

module.exports = () => [
  targetConfig('cjs'),
  targetConfig('esm'),
  targetConfig('iife')
]
