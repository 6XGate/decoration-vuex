const { resolve } = require('node:path')
const process = require('node:process')
const nodeExternals = require('webpack-node-externals')
const WebpackNotifierPlugin = require('webpack-notifier')
const WebpackBarPlugin = require('webpackbar')
const { AvailableConfigs, ConfigResolver } = require('./schema/webpack.schema.cjs')

const kConfigs = AvailableConfigs.parse({
  cjs: { chunk: 'index.cjs', name: undefined, type: 'commonjs', emitDts: false },
  esm: { chunk: 'index.esm', name: undefined, type: 'module', emitDts: true },
  iife: { chunk: 'index.iife', name: 'VueClassComponent', type: 'assign', emitDts: false }
})

const targetConfig = ConfigResolver.implement((mode, minify, config) => ({
  mode,
  entry: { [kConfigs[config].chunk]: './src/index.ts' },
  target: config === 'iife' ? ['web'] : ['es2020'],
  output: {
    path: resolve(__dirname, 'dist'),
    filename: minify ? '[name].min.js' : '[name].js',
    library: {
      name: kConfigs[config].name,
      type: kConfigs[config].type
    }
  },
  plugins: [
    // Fancy progress bars.
    new WebpackBarPlugin(),
    // Desktop notification when done.
    new WebpackNotifierPlugin({
      appID: 'WebPack Build',
      title: 'WebPack Build',
      hint: process.platform === 'linux' ? 'int:transient:1' : undefined,
      timeout: 10
    })
  ],
  module: {
    rules: [
      // TypeScript support.
      {
        test: /\.(ts|tsx)$/ui,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
        options: {
          configFile: `tsconfig.${config}.json`,
          onlyCompileBundledFiles: true,
          useCaseSensitiveFileNames: true,
          compilerOptions: {
            declaration: kConfigs[config].emitDts && !minify
          }
        }
      }
    ],
    // Make sure dynamic imports use eager loading.
    parser: {
      javascript: {
        dynamicImportMode: 'eager'
      }
    }
  },
  // Resolve TypeScript and JavaScript without extensions.
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs']
  },
  // Support creating ECMAScript modules.
  experiments: { outputModule: true },
  // Make sure all node modules and npm packages are not bundled.
  externalsPresets: { node: true },
  externals: [nodeExternals()],
  // Minification
  optimization: { minimize: minify },
  // Add source maps.
  devtool: mode === 'production' ? 'eval-source-map' : 'source-map',
  // Only show compiled assets and build time.
  stats: { preset: 'errors-warnings', assets: true, colors: true }
}))

module.exports = (env, argv) => [
  targetConfig(argv.mode ?? env.NODE_ENV ?? 'production', false, 'cjs'),
  targetConfig(argv.mode ?? env.NODE_ENV ?? 'production', false, 'esm'),
  targetConfig(argv.mode ?? env.NODE_ENV ?? 'production', false, 'iife'),
  targetConfig(argv.mode ?? env.NODE_ENV ?? 'production', true, 'iife')
]
