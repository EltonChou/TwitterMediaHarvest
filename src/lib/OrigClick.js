const header = new Headers()

const url =
  'https://api.twitter.com/2/timeline/conversation/1109811284424290310.json'

header.append(
  'Authorization',
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
)
header.append(
  'User-Agent',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
)
header.append('x-guest-token', '1114970439367843840')

let response = await fetch(url, {
  credentials: 'same-origin',
  headers: header,
  method: 'GET',
})

let data = await response.json()

let media_src =
  data.globalObjects.tweets['1109811284424290310'].extended_entities.media[0]
    .video_info.variants[0].url
