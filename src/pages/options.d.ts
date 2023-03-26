type FeatureControlProps = {
  isEnabled: boolean
  handleChange: () => void
}

type FeatureAction = {
  type: 'toggleNsfw' | 'toggleThumbnail'
}

type FeatureInitAction = {
  type: 'init'
  payload: FeatureSettings
}
