function i18n(
  msg: string,
  context?: string,
  placeholders?: Record<string, string>
) {
  return msg + context || '' + JSON.stringify(placeholders)
}

function nope(msg: string) {
  return msg
}

function getText(msg: string) {
  return msg
}

i18n('kappa')
i18n('kappa', 'test')
i18n('kappa', 'test', { foo: 'bar' })
nope('kappa')
getText('keepo')
