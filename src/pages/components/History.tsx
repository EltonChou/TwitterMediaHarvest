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
import { Action, exchangeInternal } from '@libs/browser'
import useDownloadHistory, { type SearchPredicate } from '@pages/hooks/useDownloadHistory'
import { i18n } from '@pages/utils'
import type { DownloadHistoryItem, DownloadHistoryMediaType } from '@schema'
import React, { memo, useRef } from 'react'
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

const ItemActions = (props: ItemActionsProps) => (
  <HStack>
    <Box>
      <Link target="_blank" href={`https://x.com/i/web/status/${props.tweetId}`}>
        <IconButton aria-label="Open post" icon={<Icon as={BiLinkExternal} />} />
      </Link>
    </Box>
    <IconButton
      aria-label="Download"
      icon={<Icon as={BiDownload} />}
      onClick={() =>
        exchangeInternal({
          action: Action.Download,
          data: { screenName: props.screenName, tweetId: props.tweetId },
        })
      }
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
      src={props.url + ':thumb'}
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

type ItemRowProps = {
  item: DownloadHistoryItem
}

const convertMediaTypeToLocaleString = (mediaType: DownloadHistoryMediaType) => {
  switch (mediaType) {
    case 'image':
      return i18n('options_history_table_mediaType_image')

    case 'video':
      return i18n('options_history_table_mediaType_video')

    case 'mixed':
      return i18n('options_history_table_mediaType_mixed')

    default:
      return i18n('options_history_table_mediaType_mixed')
  }
}

type ItemTypeIconProps = {
  type: DownloadHistoryMediaType
}

const ItemTypeIcon = (props: ItemTypeIconProps) => (
  <HStack gap={3}>
    <Icon as={BiImage} boxSize={5} color={props.type === 'video' ? 'dimgray' : 'white'} />
    <Icon as={BiFilm} boxSize={5} color={props.type === 'image' ? 'dimgray' : 'white'} />
  </HStack>
)

const ItemRow = (props: ItemRowProps) => (
  <Tr>
    <Td>
      <ItemThumbnail url={props.item.thumbnail} />
    </Td>
    <Td w={'40ch'}>
      <ItemUser
        id={props.item.userId}
        name={props.item.displayName}
        account={props.item.screenName}
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
      <ItemActions tweetId={props.item.tweetId} screenName={props.item.screenName} />
    </Td>
  </Tr>
)

const TableHeads = () => (
  <Tr>
    <Th>{i18n('options_history_table_thumbnail')}</Th>
    <Th>{i18n('options_history_table_user')}</Th>
    <Th>{i18n('options_history_table_mediaType')}</Th>
    <Th>{i18n('options_history_table_tweetTime')}</Th>
    <Th>{i18n('options_history_table_downloadTime')}</Th>
    <Th>{i18n('options_history_table_actions')}</Th>
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

const makeUsernamePredicate =
  (name?: string): SearchPredicate =>
  item =>
    item.displayName.toLowerCase().includes((name || '').toLowerCase()) ||
    item.screenName.toLowerCase().includes((name || '').toLowerCase())

const enum MediaTypeSelectToken {
  ALL = 'all',
  IMAGE = 'image',
  VIDEO = 'video',
  MIXED = 'mixed',
}

const makeMediaTypePredicate = (mediaType: MediaTypeSelectToken): SearchPredicate => {
  switch (mediaType) {
    case MediaTypeSelectToken.ALL:
      return item => true

    case MediaTypeSelectToken.IMAGE:
      return item => item.mediaType === 'image'

    case MediaTypeSelectToken.VIDEO:
      return item => item.mediaType === 'video'

    case MediaTypeSelectToken.MIXED:
      return item => item.mediaType === 'mixed'

    default:
      return item => true
  }
}

const HistoryTable = () => {
  const downloadHistory = useDownloadHistory(20)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const mediaTypeSelectRef = useRef<HTMLSelectElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  const scrollTableToTop = () =>
    tableRef.current && tableRef.current.scrollTo({ top: 0, behavior: 'smooth' })

  const prevPage = () => {
    downloadHistory.handler.prevPage(scrollTableToTop)
  }
  const nextPage = () => {
    downloadHistory.handler.nextPage(scrollTableToTop)
  }
  const refresh = () => {
    downloadHistory.handler.refresh(scrollTableToTop)
    formRef.current.reset()
    search()
  }

  const search = () => {
    downloadHistory.handler.search(
      makeUsernamePredicate(usernameInputRef?.current?.value),
      makeMediaTypePredicate(
        mediaTypeSelectRef?.current?.value as unknown as MediaTypeSelectToken
      )
    )
  }

  return (
    <>
      <HStack>
        <form ref={formRef} style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
          <Input
            ref={usernameInputRef}
            type="search"
            name="username"
            placeholder={i18n('options_history_table_input_placeholder_username')}
            onInput={() => {
              search()
              scrollTableToTop()
            }}
            onChange={() => {
              search()
              scrollTableToTop()
            }}
            flexShrink={1}
          />
          <Select
            ref={mediaTypeSelectRef}
            title={i18n('options_history_table_select_title_mediaType')}
            name="mediaType"
            onChange={() => {
              search()
              scrollTableToTop()
            }}
            defaultValue={MediaTypeSelectToken.ALL}
            flexShrink={4}
          >
            <option value={MediaTypeSelectToken.ALL}>
              {i18n('options_history_table_select_mediaType_all')}
            </option>
            <option value={MediaTypeSelectToken.IMAGE}>
              {i18n('options_history_table_select_mediaType_image')}
            </option>
            <option value={MediaTypeSelectToken.VIDEO}>
              {i18n('options_history_table_select_mediaType_video')}
            </option>
            <option value={MediaTypeSelectToken.MIXED}>
              {i18n('options_history_table_select_mediaType_mixed')}
            </option>
          </Select>
        </form>
        <HStack>
          <IconButton
            aria-label={i18n('options_history_table_ariaLabel_prevPage')}
            icon={<Icon boxSize={8} as={BiChevronLeft} />}
            onClick={prevPage}
            background={'transparent'}
          />
          <Box minW={'8ch'} textAlign={'center'}>
            <Text>{`${downloadHistory.info.currentPage} / ${downloadHistory.info.totalPages}`}</Text>
          </Box>
          <IconButton
            aria-label={i18n('options_history_table_ariaLabel_nextPage')}
            icon={<Icon boxSize={8} as={BiChevronRight} />}
            onClick={nextPage}
            background={'transparent'}
          />
          <IconButton
            aria-label={i18n('options_history_table_ariaLabel_refresh')}
            icon={<Icon boxSize={5} as={BiRefresh} />}
            onClick={refresh}
          />
        </HStack>
      </HStack>
      <TableContainer
        ref={tableRef}
        maxH={'65vh'}
        whiteSpace={'break-spaces'}
        overflowY={'auto'}
      >
        <Table variant="striped" colorScheme="teal" size={'md'} width={'100%'}>
          <Thead position={'sticky'} top={0} zIndex={99} background={'black'}>
            <TableHeads />
          </Thead>
          <Tbody>
            {downloadHistory.info.isLoaded ? (
              downloadHistory.entities.map((entity, i) => (
                <ItemRow key={i} item={entity.toDownloadHistoryItem()} />
              ))
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
