const { z } = require('zod')

const ConfigNames = z.enum(['cjs', 'esm', 'iife'])

const ConfigTypes = z.enum(['commonjs', 'module', 'window'])

const Config = z.object({
  chunk: z.string().min(1),
  name: z.string().min(1).optional(),
  type: ConfigTypes,
  emitDts: z.boolean()
})

const AvailableConfigs = z.record(ConfigNames, Config)

/** @type {z.ZodType<import('webpack').Configuration>} */
const WebpackConfig = z.instanceof(Object)

const ConfigResolver = z.function(z.tuple([ConfigNames]), WebpackConfig)

module.exports = {
  AvailableConfigs,
  Config,
  ConfigNames,
  ConfigResolver,
  ConfigTypes,
  WebpackConfig
}
