const contentScriptConfig = require('./webpack.contentScript.config')
const serviceConfig = require('./webpack.service.config')

module.exports = (env, argv) => {
  return [contentScriptConfig(env, argv), serviceConfig(env, argv)]
}
