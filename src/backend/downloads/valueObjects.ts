import ValueObject from '@backend/valueObject'
import path from 'path'

/** Make original quality source of tweet media from media url */
const makeImageOrigSrc = (url: string): string => `${url}:orig`

export class TweetMediaFileVO extends ValueObject<TweetMediaFileProps> implements ITweetMediaFileDetail {
  constructor(url: string, index = 0) {
    super({ url: url, order: index })
  }

  isVideo() {
    return this.ext === '.mp4'
  }

  get src() {
    return this.isVideo() ? this.props.url : makeImageOrigSrc(this.props.url)
  }

  get ext() {
    return path.extname(this.props.url)
  }

  get hashName() {
    return path.basename(this.props.url, this.ext)
  }

  get order() {
    return this.props.order + 1
  }
}
