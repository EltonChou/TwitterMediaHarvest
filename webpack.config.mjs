import contentScriptConfig from './webpack.contentScript.config.mjs'
import serviceConfig from './webpack.service.config.mjs'

export default (env, argv) => {
  return [contentScriptConfig(env, argv), serviceConfig(env, argv)]
}
