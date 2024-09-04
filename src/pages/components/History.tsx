import type MediaType from '#enums/mediaType'
import useDownloadHistory, {
  type DownloadHistoryInfo,
} from '#pages/hooks/useDownloadHistory'
import { i18n } from '#pages/utils'
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
      onClick={() => {
        /** TODO: send download media message */
      }}
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
  item: DownloadHistoryInfo
}

const convertMediaTypeToLocaleString = (mediaType: MediaType) => {
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
  type: MediaType
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

const enum MediaTypeSelectToken {
  ALL = '*',
  IMAGE = 'image',
  VIDEO = 'video',
  MIXED = 'mixed',
}

const lazyHandler = (lazyTime: number) => {
  let timeout: number
  return (handler: TimerHandler) => () => {
    clearTimeout(timeout)
    timeout = setTimeout(handler, lazyTime)
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
    downloadHistory.pageHandler.prevPage(scrollTableToTop)
  }
  const nextPage = () => {
    downloadHistory.pageHandler.nextPage(scrollTableToTop)
  }
  const refresh = () => {
    downloadHistory.handler.refresh(scrollTableToTop)
    formRef.current?.reset()
    search()
  }

  const search = () => {
    downloadHistory.handler.search({
      filter: {
        mediaType: (mediaTypeSelectRef?.current?.value as MediaType) ?? '*',
        userName: usernameInputRef?.current?.value ?? '*',
      },
      hashtags: [],
    })
  }

  const handleInput = lazyHandler(500)(() => {
    search()
    scrollTableToTop()
  })

  return (
    <>
      <HStack>
        <form
          ref={formRef}
          style={{ display: 'flex', flex: 1, gap: '0.5rem' }}
          onSubmit={e => e.preventDefault()}
        >
          <Input
            ref={usernameInputRef}
            type="search"
            name="username"
            placeholder={i18n('options_history_table_input_placeholder_username')}
            onInput={handleInput}
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
        <Table
          variant="striped"
          colorScheme="teal"
          size={'md'}
          width={'100%'}
          onDragOver={e => e.preventDefault()}
          // {...(process.env.NODE_ENV === 'production'
          //   ? {}
          //   : { onDrop: handlePortableHistoryFileDrop, zIndex: 99 })}
        >
          <Thead position={'sticky'} top={0} zIndex={1} background={'black'}>
            <TableHeads />
          </Thead>
          <Tbody>
            {downloadHistory.info.isLoaded ? (
              downloadHistory.items.map((item, i) => <ItemRow key={i} item={item} />)
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
