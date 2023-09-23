import { ValidationError } from '@backend/errors'
import ValueObject from '@backend/valueObject'
import type { Medum2, Tweet } from 'types/twitter/tweet'

type TweetUser = {
  name: string
  screen_name: string
  rest_id: string
}

export class TweetVO
  extends ValueObject<{ tweet: Tweet; user: TweetUser }>
  implements TweetDetail
{
  constructor(tweet: Tweet, tweetUser: TweetUser) {
    super({ tweet: tweet, user: tweetUser })
    this.validate()
  }

  get medias(): Medum2[] {
    return this.props?.tweet.extended_entities?.media
  }

  get id(): string {
    return this.props.tweet.id_str
  }

  get displayName(): string {
    return this.props.user.name
  }

  get screenName(): string {
    return this.props.user.screen_name
  }

  get userId(): string {
    return this.props.user.rest_id
  }

  get createdAt(): Date {
    return new Date(Date.parse(this.props.tweet.created_at))
  }

  get hashTags(): string[] {
    return Array.from(this.props.tweet?.entities?.hashtags || []).map(v => v['text'])
  }

  validate(): TweetVO {
    const isValid = [
      this.props.tweet,
      this.props.user,
      this.props.user?.name,
      this.props.user?.rest_id,
      this.props.user?.screen_name,
      this.props.tweet?.created_at,
      this.props.tweet?.extended_entities,
    ].every(v => Boolean(v))

    if (!isValid) throw new ValidationError('Cannot map tweet correctly')
    return this
  }
}
