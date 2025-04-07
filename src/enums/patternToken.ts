/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const enum PatternToken {
  Account = '{account}',
  AccountId = '{accountId}',
  TweetId = '{tweetId}',
  Serial = '{serial}',
  Hash = '{hash}',
  Date = '{date}',
  Datetime = '{datetime}',
  UnderscoreDateTime = '{underscoreDatetime}',
  Timestamp = '{timestamp}',
  TweetDate = '{tweetDate}',
  TweetDatetime = '{tweetDatetime}',
  UnderscoreTweetDatetime = '{underscroeTweetDatetime}',
  TweetTimestamp = '{tweetTimestamp}',
}

export default PatternToken
