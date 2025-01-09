import type { Factory } from '#domain/factories/base'
import type { SearchDownloadHistory } from '#domain/useCases/searchDownloadHistory'
import type { SearchTweetIdsByHashTags } from '#domain/useCases/searchTweetIdsByHashtags'
import MediaType from '#enums/mediaType'
import { getText as i18n } from '#libs/i18n'
import { DownloadTweetMediaMessage, sendMessage } from '#libs/webExtMessage'
import useDownloadHistory, {
  type DownloadHistoryItem,
} from '#pages/hooks/useDownloadHistory'
import { SearchDownloadHistoryUseCase } from '../../applicationUseCases/searchDownloadHistory'
import {
  Box,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Link,
  Select,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import React, { ForwardedRef, forwardRef, memo, useImperativeHandle, useRef } from 'react'
import {
  BiChevronLeft,
  BiChevronRight,
  BiDownload,
  BiFilm,
  BiImage,
  BiLinkExternal,
  BiRefresh,
} from 'react-icons/bi'

type ItemActionsProps = {
  tweetId: string
  screenName: string
}

export const ItemActions = (props: ItemActionsProps) => (
  <HStack>
    <Box>
      <Link
        target="_blank"
        href={`https://x.com/i/web/status/${props.tweetId}`}
        data-testid="item-action-openTweet"
      >
        <IconButton aria-label="Open post" icon={<Icon as={BiLinkExternal} />} />
      </Link>
    </Box>
    <IconButton
      aria-label="Download"
      icon={<Icon as={BiDownload} />}
      onClick={() => {
        sendMessage(
          new DownloadTweetMediaMessage({
            screenName: props.screenName,
            tweetId: props.tweetId,
          })
        )
      }}
      data-testid="item-action-download"
    />
  </HStack>
)

type ItemThumbnailProps = {
  url: string
}

const ItemThumbnail = (props: ItemThumbnailProps) => (
  <Box>
    <Image
      alt="Thumbnail"
      src={props.url}
      fallbackSrc="https://via.placeholder.com/150"
      objectFit={'cover'}
      boxSize={'90'}
      minW={'60px'}
    />
  </Box>
)

type ItemTimestampProps = {
  datetime: Date
}

const ItemTimestamp = (props: ItemTimestampProps) => (
  <Text>{props.datetime.toLocaleString()}</Text>
)

type ItemUserProps = {
  id: string
  name: string
  account: string
}

const ItemUser = memo((props: ItemUserProps) => {
  const userUrl = props?.id
    ? `https://x.com/i/user/${props.id}`
    : `https://x.com/${props.account}`

  return (
    <Box>
      <Text>{props.name}</Text>
      <Text mt={'1'}>
        <Link href={userUrl} target="_blank">
          {'@' + props.account}
        </Link>
      </Text>
    </Box>
  )
})

const _convertMediaTypeToLocaleString = (mediaType: MediaType) => {
  switch (mediaType) {
    case 'image':
      return i18n('Image', 'options:history:mediaType')

    case 'video':
      return i18n('Video', 'options:history:mediaType')

    case 'mixed':
      return i18n('Mixed', 'options:history:mediaType')

    default:
      return i18n('Mixed', 'options:history:mediaType')
  }
}

type ItemTypeIconProps = {
  type: MediaType
}

const ItemTypeIcon = (props: ItemTypeIconProps) => (
  <HStack gap={3}>
    <Icon as={BiImage} boxSize={5} color={props.type === 'video' ? 'dimgray' : 'white'} />
    <Icon as={BiFilm} boxSize={5} color={props.type === 'image' ? 'dimgray' : 'white'} />
  </HStack>
)

type ItemRowProps = {
  item: DownloadHistoryItem
}

const ItemRow = (props: ItemRowProps) => (
  <Tr data-testid="history-item">
    <Td>
      <ItemThumbnail url={props.item.thumbnail ?? ''} />
    </Td>
    <Td w={'40ch'}>
      <ItemUser
        id={props.item.user.id}
        name={props.item.user.displayName}
        account={props.item.user.screenName}
      />
    </Td>
    <Td>
      <ItemTypeIcon type={props.item.mediaType} />
    </Td>
    <Td w={'25ch'}>
      <ItemTimestamp datetime={props.item.tweetTime} />
    </Td>
    <Td w={'25ch'}>
      <ItemTimestamp datetime={props.item.downloadTime} />
    </Td>
    <Td>
      <ItemActions tweetId={props.item.id} screenName={props.item.user.screenName} />
    </Td>
  </Tr>
)

const TableHeads = () => (
  <Tr>
    <Th>{i18n('thumbnail', 'options:history:table:head')}</Th>
    <Th>{i18n('user', 'options:history:table:head')}</Th>
    <Th>{i18n('type', 'options:history:table:head')}</Th>
    <Th>{i18n('post time', 'options:history:table:head')}</Th>
    <Th>{i18n('download time', 'options:history:table:head')}</Th>
    <Th>{i18n('actions', 'options:history:table:head')}</Th>
  </Tr>
)

const LoadingRow = () => (
  <Tr>
    <Td>
      <Skeleton height={'90px'} width={'90px'} />
    </Td>
    <Td width={'20ch'}>
      <Skeleton width={'100%'}>
        <Text>The user name.</Text>
      </Skeleton>
      <Skeleton width={'15ch'} mt="1">
        <Text>Could be up to 15.</Text>
      </Skeleton>
    </Td>
    <Td>
      <Skeleton height={'1em'} width={'6ch'}>
        Media type
      </Skeleton>
    </Td>
    <Td>
      <Skeleton width={'18ch'}>{new Date().toLocaleString()}</Skeleton>
    </Td>
    <Td>
      <Skeleton width={'18ch'}>{new Date().toLocaleString()}</Skeleton>
    </Td>
    <Td>
      <Skeleton width={'6ch'}>
        <Icon as={BiDownload} />
        <Icon as={BiDownload} />
      </Skeleton>
    </Td>
  </Tr>
)

const LoadingBody = () => (
  <>
    <LoadingRow />
    <LoadingRow />
    <LoadingRow />
    <LoadingRow />
    <LoadingRow />
  </>
)

export const enum MediaTypeSelectToken {
  ALL = '*',
  IMAGE = 'image',
  VIDEO = 'video',
  MIXED = 'mixed',
}

/**
 * A wrapped setTimeout,It will canceled previous handler when it called multi times.
 * @param lazyTime milliseconds
 */
export const lazyHandler = (lazyTime: number) => {
  let timeout: number
  return (handler: TimerHandler) => () => {
    clearTimeout(timeout)
    timeout = setTimeout(handler, lazyTime)
  }
}

interface PageNavigatorProps {
  nextPage: () => void
  prevPage: () => void
  currentPage: number
  totalPages: number
}

export const PageNavigator = (props: PageNavigatorProps) => (
  <HStack>
    <IconButton
      aria-label={i18n('Previous page', 'options:history')}
      icon={<Icon boxSize={8} as={BiChevronLeft} />}
      onClick={props.prevPage}
      background={'transparent'}
      data-testid="table-nav-prevPage"
    />
    <Box minW={'8ch'} textAlign={'center'}>
      <Text>{`${props.currentPage} / ${props.totalPages}`}</Text>
    </Box>
    <IconButton
      aria-label={i18n('Next page', 'options:history')}
      icon={<Icon boxSize={8} as={BiChevronRight} />}
      onClick={props.nextPage}
      background={'transparent'}
      data-testid="table-nav-nextPage"
    />
  </HStack>
)

interface HistoryTableActionBarProps {
  refresh: () => void
}

export const ActionBar = (props: HistoryTableActionBarProps) => (
  <HStack>
    <IconButton
      aria-label={i18n('Refresh', 'options:history')}
      icon={<Icon boxSize={5} as={BiRefresh} />}
      onClick={props.refresh}
      data-testid="table-action-refresh"
    />
  </HStack>
)

interface SearchFormProps {
  update: () => void
}

export interface SearchFormComponent {
  reset: HTMLFormElement['reset']
  value: {
    username?: string
    mediaType?: MediaTypeSelectToken
  }
}

export const SearchForm = forwardRef(
  (props: SearchFormProps, ref: ForwardedRef<SearchFormComponent>) => {
    const usernameInputRef = useRef<HTMLInputElement>(null)
    const mediaTypeSelectRef = useRef<HTMLSelectElement>(null)
    const formRef = useRef<HTMLFormElement>(null)

    useImperativeHandle<SearchFormComponent, SearchFormComponent>(ref, () => ({
      reset() {
        return formRef.current?.reset
      },
      get value() {
        return {
          username: usernameInputRef.current?.value,
          mediaType: mediaTypeSelectRef.current?.value as
            | MediaTypeSelectToken
            | undefined,
        }
      },
    }))

    return (
      <form
        ref={formRef}
        style={{ display: 'flex', flex: 1, gap: '0.5rem' }}
        onSubmit={e => e.preventDefault()}
        data-testid="search-form"
      >
        <Input
          ref={usernameInputRef}
          type="search"
          name="username"
          placeholder={i18n('Username', 'options:history:input:placeholder')}
          onInput={lazyHandler(500)(props.update)}
          flexShrink={1}
          data-testid="username-input"
        />
        <Select
          ref={mediaTypeSelectRef}
          title={i18n('Select media type', 'options:history:select')}
          name="mediaType"
          onChange={() => props.update()}
          defaultValue={MediaTypeSelectToken.ALL}
          flexShrink={4}
          data-testid="mediaType-select"
        >
          <option value={MediaTypeSelectToken.ALL}>
            {i18n('All', 'options:history:mediaType:option')}
          </option>
          <option value={MediaTypeSelectToken.IMAGE}>
            {i18n('Image', 'options:history:mediaType:option')}
          </option>
          <option value={MediaTypeSelectToken.VIDEO}>
            {i18n('Video', 'options:history:mediaType:option')}
          </option>
          <option value={MediaTypeSelectToken.MIXED}>
            {i18n('Mixed', 'options:history:mediaType:option')}
          </option>
        </Select>
      </form>
    )
  }
)

const mediaTypeSelectTokenToMediaType: Factory<
  MediaTypeSelectToken | undefined,
  '*' | MediaType
> = (token?) => {
  switch (token) {
    case MediaTypeSelectToken.ALL:
      return '*'

    case MediaTypeSelectToken.IMAGE:
      return MediaType.Image

    case MediaTypeSelectToken.VIDEO:
      return MediaType.Video

    case MediaTypeSelectToken.MIXED:
      return MediaType.Mixed

    default:
      return '*'
  }
}

type HistoryTableProps = {
  searchDownloadHistory: SearchDownloadHistory
  searchTweetIdsByHashtags: SearchTweetIdsByHashTags
}

const HistoryTable = ({
  searchDownloadHistory,
  searchTweetIdsByHashtags,
}: HistoryTableProps) => {
  const downloadHistory = useDownloadHistory({
    initItemPerPage: 20,
    searchDownloadHistoryUseCase: new SearchDownloadHistoryUseCase(
      searchDownloadHistory,
      searchTweetIdsByHashtags
    ),
  })
  const searchFormRef = useRef<SearchFormComponent>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const scrollTableToTop = () =>
    tableRef.current && tableRef.current.scrollTo({ top: 0, behavior: 'smooth' })

  const prevPage = () => {
    downloadHistory.pageHandler.prevPage({ cbs: [scrollTableToTop] })
  }
  const nextPage = () => {
    downloadHistory.pageHandler.nextPage({ cbs: [scrollTableToTop] })
  }
  const refresh = () => {
    downloadHistory.handler.refresh({ cbs: [scrollTableToTop] })
    searchFormRef.current?.reset()
  }

  const search = () => {
    downloadHistory.handler.search({
      filter: {
        mediaType: mediaTypeSelectTokenToMediaType(
          searchFormRef.current?.value.mediaType
        ),
        userName: searchFormRef.current?.value.username?.trim() || '*',
      },
      hashtags: [],
    })
  }

  const updateResult = () => {
    search()
    scrollTableToTop()
  }

  return (
    <>
      <HStack>
        <SearchForm update={updateResult} ref={searchFormRef} />
        <HStack>
          <PageNavigator
            prevPage={prevPage}
            nextPage={nextPage}
            totalPages={downloadHistory.info.totalPages}
            currentPage={downloadHistory.info.currentPage}
          />
          <ActionBar refresh={refresh} />
        </HStack>
      </HStack>
      <TableContainer
        ref={tableRef}
        maxH={'65vh'}
        whiteSpace={'break-spaces'}
        overflowY={'auto'}
      >
        <Table variant="striped" colorScheme="teal" size={'md'} width={'100%'}>
          <Thead position={'sticky'} top={0} zIndex={1} background={'black'}>
            <TableHeads />
          </Thead>
          <Tbody>
            {downloadHistory.info.isLoaded ? (
              downloadHistory.items.map(item => <ItemRow key={item.id} item={item} />)
            ) : (
              <LoadingBody />
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}

export default HistoryTable
