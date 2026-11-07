# Add a Cache Endpoint

This instruction uses ASD-STE100 Simplified Technical English.

## 1 Scope

This instruction shows how to add an X GraphQL endpoint to the tweet response
cache.

Use this instruction when the extension must cache tweets from a new endpoint.

## 2 Rules

- Use the available code. Do not write the same code again.
- Make the smallest change that operates correctly.
- Write the tests before the implementation (TDD).
- Use `yarn`. Do not use `npm` or `npx`.
- Do not put infrastructure code in `src/domain/`.
- Each response format has a separate parser path.
- Put each format version in a version subdirectory: `v1/` (legacy format),
  `v2/` (new format). Do not add a version suffix or prefix to file names.
- Put code and types that all formats use at the top level of `parsers/` and
  `types/`. A version file must not use a type from a different version.
- Do not change a new-format tweet into the legacy shape.
- Do not change the legacy parser to read the new format.

## 3 Data Flow

The response goes through four steps:

| Step | File                                                 | Function                                                                                     |
| ---- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1    | `src/injections/injectFetch.ts`                      | `Pattern.tweetRelated` captures the XHR and `fetch` responses. It sends `mh:media-response`. |
| 2    | `src/contentScript/main.ts`                          | `responseTypeCriterias` gives the `ResponseType`. It sends `CaptureResponseMessage`.         |
| 3    | `src/libs/webExtMessage/messages/captureResponse.ts` | `messageSchema` validates the response type.                                                 |
| 4    | `src/applicationUseCases/captureResponseAndCache.ts` | Validates the body (Joi), parses the tweets, and saves media tweets.                         |

NOTE: If one step does not know the endpoint, the cache does not get the
tweets. Usually, no error shows.

## 4 Preparation

### 4.1 Get a Sample

1. Open the X page that calls the endpoint.
2. In the browser developer tools, find the GraphQL request.
3. Copy the response body into a JSON file.

### 4.2 Find the Response Format

Compare the sample with this table:

| Item                 | Legacy format                    | New format                 |
| -------------------- | -------------------------------- | -------------------------- |
| Instruction type key | `type`                           | `__typename`               |
| Entry keys           | `entryId`, `sortIndex`           | `entry_id`, `sort_index`   |
| Item content         | `content.itemContent`            | `content.content`          |
| Module item content  | `items[].item.itemContent`       | `items[].item.content`     |
| Tweet ID             | `legacy.id_str`                  | `rest_id`                  |
| Tweet text           | `legacy.full_text`               | `details.full_text`        |
| Tweet time           | `legacy.created_at`              | `details.created_at_ms`    |
| Hashtags             | `legacy.entities.hashtags`       | `details.hashtag_entities` |
| Media                | `legacy.extended_entities.media` | `media_entities2`          |
| User `core`          | Has `created_at`                 | No `created_at`            |

If the sample is not the same as one of the two columns, it is a different
format. Make a separate parser path for it (refer to 8.3).

### 4.3 Find the Instructions Path

Find the path from the body root to the `instructions` array.

Examples:

| Endpoint              | Path to `instructions`                                                                         | Format |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| SearchTimeline        | `data.search_by_raw_query.search_timeline.timeline.instructions`                               | Legacy |
| SearchByRawQuery      | `data.search_by_raw_query.search_timeline.timeline.instructions`                               | New    |
| UserOriginalsTimeline | `data.user_result_by_screen_name.result.profile_user_originals_timeline.timeline.instructions` | New    |

CAUTION: Two endpoints can have the same path and a different format. Always
examine the tweet format.

### 4.4 Count the Expected Media Tweets

1. Count the top-level tweets that have media.
2. Do not count quoted tweets. The parsers do not cache quoted tweets.
3. Legacy format: for each retweet with media, count two items.
   `eagerParseTweet` caches the retweet and the original tweet.

## 5 Procedure A: Capture the Endpoint

1. In `src/injections/injectFetch.ts`, add the query name to the `queryName`
   group of `Pattern.tweetRelated`.
2. In `src/libs/webExtMessage/messages/captureResponse.ts`, add a value to
   `enum ResponseType`. Use the query name as the value.

   CAUTION: If the value is not in `.valid(...)`, the message validation fails.
   The cache does not get the tweets.

3. In the same file, add the new value to the `.valid(...)` list of
   `messageSchema`.
4. In `src/contentScript/main.ts`, add `{ type, endpoint }` to
   `responseTypeCriterias`.

   NOTE: `detectResponseTypeByEndpoint` uses `endsWith` and the first match.
   If one endpoint name is the end of a different name, put the longer name
   first.

## 6 Procedure B: Write the Tests

1. Save the sample in the `test-data` directory of its format:
   - Legacy format: `src/libs/XApi/parsers/v1/test-data/<QueryName>.json`.
   - New format: `src/libs/XApi/parsers/v2/test-data/<QueryName>.json`.
2. In `src/applicationUseCases/captureResponseAndCache.test.ts`, add a test
   for the new `ResponseType`. Send the sample body to `process`.
3. Make sure that the test expects `saveAll` with the number from 4.4.
4. New format: add parser tests in the test file of the new-format parser
   path (refer to 8.2).
5. Do the tests:

   ```sh
   yarn jest <test file>
   ```

6. Make sure that the new tests fail.

## 7 Procedure C: Body Schema and Handler

Do these steps in `src/applicationUseCases/captureResponseAndCache.ts`, if
the step does not give a different file.

1. Examine the available `process…Response` methods.
2. If a method has the same instructions path and the same format, add a
   `case` for the new `ResponseType` to that method. Then go to procedure D.

   EXAMPLE: `UserMedia`, `Likes`, and `UserTweets` use
   `processUserTimelineResponse`.

3. Add a body type:
   - Legacy format: in `src/libs/XApi/types/v1/tweet.d.ts`.
   - New format: in the type file of the new-format parser path.

   CAUTION: If an object level does not have `.unknown(true)`, an extra key
   causes a validation error. EXAMPLE: the `id` key in
   `data.search_by_raw_query` of SearchByRawQuery.

4. Add a Joi schema for the body. Mark each object level with
   `.required().unknown(true)`.
5. Mark `instructions` with `Joi.array().required()`.
6. Add a `process<QueryName>Response` method. Copy an available method for
   the same format.
7. In the new method, change the schema and the instructions path.
8. Add a `case` for the new `ResponseType` in the `switch` of `process`.

## 8 Procedure D: Parser

### 8.1 Legacy Format

1. The legacy parser path is in `src/libs/XApi/parsers/v1/` and
   `src/libs/XApi/types/v1/`.
2. Use `retriveMediaTweetsFromInstructions`.
3. Do not change the legacy parser.

### 8.2 New Format

1. Use the new-format parser path. It is in the `v2` subdirectories:

   | File                                      | Contents                                                                       |
   | ----------------------------------------- | ------------------------------------------------------------------------------ |
   | `src/libs/XApi/types/v2/tweet.d.ts`       | `namespace XApi.V2`: instructions, entries, `Tweet`, body types.               |
   | `src/libs/XApi/parsers/v2/refinements.ts` | Type guards. `isTweet` validates the tweet. `isMediaTweet`.                    |
   | `src/libs/XApi/parsers/v2/tweet.ts`       | `retrieveTweetsFromInstruction`, `retrieveTweetFromTweetResult`, `parseTweet`. |
   | `src/libs/XApi/parsers/v2/tweet.test.ts`  | Parser tests with the fixtures in `v2/test-data/`.                             |

2. In `captureResponseAndCache.ts`, use the helper
   `retriveMediaTweetsFromInstructionsV2`.
3. Use these shared parts:
   - Domain value objects: `Tweet`, `TweetUser`, `TweetWithContent`.
   - `parseMedias` in `src/libs/XApi/parsers/tweetMedia.ts` and the media
     types in `src/libs/XApi/types/media.d.ts`. The `media_entities2` items
     have the same fields as legacy media items.
   - `#utils/result` helpers, for example `reduceToSuccesses`.
4. If a new tweet type shows (for example, a retweet), add it to the `v2`
   files only.

### 8.3 Different Format

1. Make a separate parser path in a new version subdirectory (for example,
   `parsers/v3/` and `types/v3/`).
2. Use the same file names and structure as 8.2.

## 9 Procedure E: Make Sure That the Change Operates

1. Do the new tests:

   ```sh
   yarn jest <test files>
   ```

2. Make sure that all tests pass.
3. Do the type check and all tests:

   ```sh
   yarn test
   ```

4. Do the lint:

   ```sh
   yarn lint
   ```

5. Build the development extension:

   ```sh
   yarn build:chrome:all:dev
   ```

6. Load the extension in the browser.
7. Open the X page that calls the endpoint.
8. In the service worker console, find `Cache tweet response <QueryName>`.
9. Find `Cache N tweet(s)`. If the page shows media tweets, N must be more
   than 0.
10. If users can see the change, add an entry under `[Unreleased]` in
    `CHANGELOG.md`. You can use the `changelog-maintainer` agent.

## 10 Reference

- Sample payloads for UserOriginalsTimeline and SearchByRawQuery:
  `.claude/prompts/add-cache-endpoint.md`.
