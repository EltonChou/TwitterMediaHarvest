import { ResponseType } from '#libs/webExtMessage'
import { MockTweetResponseCache } from '#mocks/caches/tweetResponseCache'
import { CaptureResponseAndCache } from './captureResponseAndCache'

describe('CaptureResponseAndCache', () => {
  const mockCache = new MockTweetResponseCache()
  let useCase: CaptureResponseAndCache
  let mockSave: jest.SpyInstance
  let mockSaveAll: jest.SpyInstance

  beforeAll(() => {
    mockSave = jest.spyOn(mockCache, 'save')
    mockSaveAll = jest.spyOn(mockCache, 'saveAll')
  })

  beforeEach(() => {
    useCase = new CaptureResponseAndCache({
      tweetResponseCache: mockCache,
    })
  })

  afterEach(() => jest.resetAllMocks())

  it('should handle invalid JSON', async () => {
    const result = await useCase.process({
      type: ResponseType.TweetDetail,
      body: 'invalid json',
    })
    expect(result).toBeInstanceOf(Error)
  })

  it('should handle tweet detail response', async () => {
    const validResponse = {
      data: {
        threaded_conversation_with_injections_v2: {
          instructions: [
            {
              type: 'TimelineAddEntries',
              entries: [
                {
                  entryId: 'tweet-1915351258162250129',
                  sortIndex: '7308020778692525678',
                  content: {
                    entryType: 'TimelineTimelineItem',
                    __typename: 'TimelineTimelineItem',
                    itemContent: {
                      itemType: 'TimelineTweet',
                      __typename: 'TimelineTweet',
                      tweet_results: {
                        result: {
                          __typename: 'Tweet',
                          rest_id: '1915351258162250129',
                          has_birdwatch_notes: false,
                          core: {
                            user_results: {
                              result: {
                                __typename: 'User',
                                id: 'VXNlcjo5NzIyNjczOTE4MDI2NjI5MTI=',
                                rest_id: '972267391802662912',
                                affiliates_highlighted_label: {},
                                has_graduated_access: true,
                                is_blue_verified: false,
                                legacy: {
                                  following: true,
                                  can_dm: true,
                                  can_media_tag: false,
                                  created_at: 'Sat Mar 10 00:26:24 +0000 2018',
                                  default_profile: false,
                                  default_profile_image: false,
                                  description: 'ごみ',
                                  entities: {
                                    description: {
                                      urls: [],
                                    },
                                    url: {
                                      urls: [
                                        {
                                          display_url:
                                            'pixiv.net/users/22932449',
                                          expanded_url:
                                            'https://www.pixiv.net/users/22932449',
                                          url: 'https://t.co/8oh6JZjcb0',
                                          indices: [0, 23],
                                        },
                                      ],
                                    },
                                  },
                                  fast_followers_count: 0,
                                  favourites_count: 808,
                                  followers_count: 124025,
                                  friends_count: 498,
                                  has_custom_timelines: true,
                                  is_translator: false,
                                  listed_count: 896,
                                  location: '',
                                  media_count: 312,
                                  name: 'nanata',
                                  normal_followers_count: 124025,
                                  pinned_tweet_ids_str: ['1915351258162250129'],
                                  possibly_sensitive: false,
                                  profile_banner_url:
                                    'https://pbs.twimg.com/profile_banners/972267391802662912/1744304810',
                                  profile_image_url_https:
                                    'https://pbs.twimg.com/profile_images/1908782530956009472/n1RpWb8Q_normal.jpg',
                                  profile_interstitial_type: '',
                                  screen_name: 'Nanata0418',
                                  statuses_count: 537,
                                  translator_type: 'none',
                                  url: 'https://t.co/8oh6JZjcb0',
                                  verified: false,
                                  want_retweets: true,
                                  withheld_in_countries: [],
                                },
                                parody_commentary_fan_label: 'None',
                                profile_image_shape: 'Circle',
                                tipjar_settings: {},
                              },
                            },
                          },
                          unmention_data: {},
                          edit_control: {
                            edit_tweet_ids: ['1915351258162250129'],
                            editable_until_msecs: '1745493900000',
                            is_edit_eligible: true,
                            edits_remaining: '5',
                          },
                          is_translatable: false,
                          views: {
                            count: '280650',
                            state: 'EnabledWithCount',
                          },
                          source:
                            '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>',
                          grok_analysis_button: true,
                          legacy: {
                            bookmark_count: 1639,
                            bookmarked: false,
                            created_at: 'Thu Apr 24 10:25:00 +0000 2025',
                            conversation_id_str: '1915351258162250129',
                            display_text_range: [0, 5],
                            entities: {
                              hashtags: [],
                              media: [
                                {
                                  display_url: 'pic.x.com/JHWgG68RHe',
                                  expanded_url:
                                    'https://x.com/Nanata0418/status/1915351258162250129/photo/1',
                                  id_str: '1915351241234014213',
                                  indices: [6, 29],
                                  media_key: '3_1915351241234014213',
                                  media_url_https:
                                    'https://pbs.twimg.com/media/GpSxzlHbYAUBbsv.jpg',
                                  type: 'photo',
                                  url: 'https://t.co/JHWgG68RHe',
                                  ext_media_availability: {
                                    status: 'Available',
                                  },
                                  features: {
                                    large: {
                                      faces: [],
                                    },
                                    medium: {
                                      faces: [],
                                    },
                                    small: {
                                      faces: [],
                                    },
                                    orig: {
                                      faces: [],
                                    },
                                  },
                                  sizes: {
                                    large: {
                                      h: 2048,
                                      w: 1197,
                                      resize: 'fit',
                                    },
                                    medium: {
                                      h: 1200,
                                      w: 701,
                                      resize: 'fit',
                                    },
                                    small: {
                                      h: 680,
                                      w: 397,
                                      resize: 'fit',
                                    },
                                    thumb: {
                                      h: 150,
                                      w: 150,
                                      resize: 'crop',
                                    },
                                  },
                                  original_info: {
                                    height: 3000,
                                    width: 1753,
                                    focus_rects: [
                                      {
                                        x: 0,
                                        y: 783,
                                        w: 1753,
                                        h: 982,
                                      },
                                      {
                                        x: 0,
                                        y: 398,
                                        w: 1753,
                                        h: 1753,
                                      },
                                      {
                                        x: 0,
                                        y: 275,
                                        w: 1753,
                                        h: 1998,
                                      },
                                      {
                                        x: 0,
                                        y: 0,
                                        w: 1500,
                                        h: 3000,
                                      },
                                      {
                                        x: 0,
                                        y: 0,
                                        w: 1753,
                                        h: 3000,
                                      },
                                    ],
                                  },
                                  allow_download_status: {
                                    allow_download: true,
                                  },
                                  media_results: {
                                    result: {
                                      media_key: '3_1915351241234014213',
                                    },
                                  },
                                },
                              ],
                              symbols: [],
                              timestamps: [],
                              urls: [],
                              user_mentions: [],
                            },
                            extended_entities: {
                              media: [
                                {
                                  display_url: 'pic.x.com/JHWgG68RHe',
                                  expanded_url:
                                    'https://x.com/Nanata0418/status/1915351258162250129/photo/1',
                                  id_str: '1915351241234014213',
                                  indices: [6, 29],
                                  media_key: '3_1915351241234014213',
                                  media_url_https:
                                    'https://pbs.twimg.com/media/GpSxzlHbYAUBbsv.jpg',
                                  type: 'photo',
                                  url: 'https://t.co/JHWgG68RHe',
                                  ext_media_availability: {
                                    status: 'Available',
                                  },
                                  features: {
                                    large: {
                                      faces: [],
                                    },
                                    medium: {
                                      faces: [],
                                    },
                                    small: {
                                      faces: [],
                                    },
                                    orig: {
                                      faces: [],
                                    },
                                  },
                                  sizes: {
                                    large: {
                                      h: 2048,
                                      w: 1197,
                                      resize: 'fit',
                                    },
                                    medium: {
                                      h: 1200,
                                      w: 701,
                                      resize: 'fit',
                                    },
                                    small: {
                                      h: 680,
                                      w: 397,
                                      resize: 'fit',
                                    },
                                    thumb: {
                                      h: 150,
                                      w: 150,
                                      resize: 'crop',
                                    },
                                  },
                                  original_info: {
                                    height: 3000,
                                    width: 1753,
                                    focus_rects: [
                                      {
                                        x: 0,
                                        y: 783,
                                        w: 1753,
                                        h: 982,
                                      },
                                      {
                                        x: 0,
                                        y: 398,
                                        w: 1753,
                                        h: 1753,
                                      },
                                      {
                                        x: 0,
                                        y: 275,
                                        w: 1753,
                                        h: 1998,
                                      },
                                      {
                                        x: 0,
                                        y: 0,
                                        w: 1500,
                                        h: 3000,
                                      },
                                      {
                                        x: 0,
                                        y: 0,
                                        w: 1753,
                                        h: 3000,
                                      },
                                    ],
                                  },
                                  allow_download_status: {
                                    allow_download: true,
                                  },
                                  media_results: {
                                    result: {
                                      media_key: '3_1915351241234014213',
                                    },
                                  },
                                },
                              ],
                            },
                            favorite_count: 16656,
                            favorited: false,
                            full_text: 'day41 https://t.co/JHWgG68RHe',
                            is_quote_status: false,
                            lang: 'und',
                            possibly_sensitive: false,
                            possibly_sensitive_editable: true,
                            quote_count: 26,
                            reply_count: 8,
                            retweet_count: 2989,
                            retweeted: false,
                            user_id_str: '972267391802662912',
                            id_str: '1915351258162250129',
                          },
                          quick_promote_eligibility: {
                            eligibility: 'IneligibleNotProfessional',
                          },
                        },
                      },
                      tweetDisplayType: 'Tweet',
                      hasModeratedReplies: false,
                    },
                    clientEventInfo: {
                      component: 'tweet',
                      element: 'tweet',
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    }

    await useCase.process({
      type: ResponseType.TweetDetail,
      body: JSON.stringify(validResponse),
    })

    expect(mockSaveAll).toHaveBeenCalled()
  })

  it('should handle rest tweet by id response', async () => {
    const validResponse = {
      data: {
        tweetResult: {
          result: {
            __typename: 'Tweet',
            core: {
              user_results: {
                result: {
                  legacy: {
                    name: 'name',
                  },
                },
              },
            },
            legacy: {
              entities: {
                hashtags: [],
                media: [{}],
              },
              extended_entities: {
                media: [{}],
              },
            },
          },
        },
      },
    }

    await useCase.process({
      type: ResponseType.TweetResultByRestId,
      body: JSON.stringify(validResponse),
    })

    expect(mockSave).toHaveBeenCalled()
  })

  it('should handle user tweets response', async () => {
    const validResponse = {
      data: {
        user: {
          result: {
            __typename: 'User',
            timeline: {
              timeline: {
                instructions: [],
              },
            },
          },
        },
      },
    }

    await useCase.process({
      type: ResponseType.UserTweets,
      body: JSON.stringify(validResponse),
    })

    expect(mockSaveAll).toHaveBeenCalled()
  })

  it.each([
    ResponseType.UserArticlesTweets,
    ResponseType.UserHighlightsTweets,
    ResponseType.UserTweets,
    ResponseType.UserTweetsAndReplies,
    ResponseType.UserMedia,
  ])('should handle %s response', async type => {
    const validResponse = {
      data: {
        user: {
          result: {
            __typename: 'User',
            timeline: {
              timeline: {
                instructions: [],
              },
            },
          },
        },
      },
    }

    await useCase.process({
      type,
      body: JSON.stringify(validResponse),
    })

    expect(mockSaveAll).toHaveBeenCalled()
  })

  it('should skip non-media tweets in rest tweet response', async () => {
    const nonMediaTweet = {
      data: {
        tweetResult: {
          result: {
            __typename: 'Tweet',
            legacy: {},
          },
        },
      },
    }

    await useCase.process({
      type: ResponseType.TweetResultByRestId,
      body: JSON.stringify(nonMediaTweet),
    })

    expect(mockSaveAll).not.toHaveBeenCalled()
  })
})
