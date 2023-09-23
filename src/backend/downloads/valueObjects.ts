import { PortableHistoryParsingError } from '@backend/errors'
import ValueObject from '@backend/valueObject'
import type { DownloadHistoryItem } from '@schema'
import Joi from 'joi'
import path from 'path'

/** Make original quality source of tweet media from media url */
const makeImageOrigSrc = (url: string): string => `${url}:orig`

export class TweetMediaFileVO
  extends ValueObject<TweetMediaFileProps>
  implements ITweetMediaFileDetail
{
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

export type PortableHistoryProps = {
  version: string
  items: DownloadHistoryItem[]
}

const downloadHistoryItemSchema = Joi.object({
  tweetId: Joi.string(),
  userId: Joi.string(),
  displayName: Joi.string(),
  screenName: Joi.string(),
  tweetTime: Joi.date(),
  downloadTime: Joi.date(),
  mediaType: Joi.string().allow('image', 'video', 'mixed'),
  thumbnail: Joi.string(),
})

const portableHistorySchema = Joi.object({
  version: Joi.string().required(),
  items: Joi.array().items(downloadHistoryItemSchema),
})

const isDatetimeKey = (key: string) => key === 'tweetTime' || key === 'downloadTime'
const downloadHistoryItemJSONReviver = (k: string, v: unknown) => {
  if (isDatetimeKey(k) && typeof v === 'string') {
    return new Date(v)
  }
  return v
}

export class PortableHistory extends ValueObject<PortableHistoryProps> {
  constructor(props: PortableHistoryProps) {
    super(props)
  }

  get version() {
    return this.props.version
  }

  get items() {
    return this.props.items
  }

  static parse(str: string): PortableHistory {
    const portableHistory = JSON.parse(str, downloadHistoryItemJSONReviver)

    const { error } = portableHistorySchema.validate(portableHistory)
    if (error) throw new PortableHistoryParsingError(error.message)

    return new PortableHistory(portableHistory)
  }

  toJSON() {
    return this.props
  }
}
