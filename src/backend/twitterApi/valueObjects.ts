import ValueObject from '@backend/valueObject'
import type { Medum2, Tweet } from 'types/twitter/tweet'

type TweetUser = {
  name: string
  screen_name: string
  rest_id: string
}

export class TweetVO extends ValueObject<{ tweet: Tweet; user: TweetUser }> {
  constructor(tweet: Tweet, tweetUser: TweetUser) {
    super({ tweet: tweet, user: tweetUser })
  }

  get medias(): Medum2[] {
    return this.props?.tweet.extended_entities?.media
  }

  get id(): string {
    return this.props.tweet.id_str
  }

  get authorName(): string {
    return this.props.user.name
  }

  get authorScreenName(): string {
    return this.props.user.screen_name
  }

  get authorId(): string {
    return this.props.user.rest_id
  }

  get createdAt(): Date {
    return new Date(Date.parse(this.props.tweet.created_at))
  }
}
