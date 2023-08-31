import { downloadHistoryRepo } from '@backend/configurations'
import type { DownloadHistoryEntity } from '@backend/downloads/models'
import {
  Box,
  HStack,
  Icon,
  IconButton,
  Image,
  Link,
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
import { i18n } from '@pages/utils'
import type { DownloadHistoryItem, DownloadHistoryMediaType } from '@schema'
import React, { memo, useEffect, useState } from 'react'
import { BiDownload, BiFilm, BiImage, BiLinkExternal } from 'react-icons/bi'

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
      src={props.url + ':thumb'}
      fallbackSrc="https://via.placeholder.com/150"
      objectFit={'cover'}
      boxSize={'90'}
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
    <Td maxW={'40ch'}>
      <ItemUser
        id={props.item.userId}
        name={props.item.displayName}
        account={props.item.screenName}
      />
    </Td>
    <Td>
      <ItemTypeIcon type={props.item.mediaType} />
    </Td>
    <Td>
      <ItemTimestamp datetime={props.item.tweetTime} />
    </Td>
    <Td>
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
    <Th maxW={'40%'}>{i18n('options_history_table_user')}</Th>
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
    <Td maxW={'40ch'} width={'40ch'}>
      <Skeleton width={'100%'}>
        <Text>The user name could be up to 50 characters.</Text>
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

const HistoryTable = () => {
  const [historyEntities, setItems] = useState<DownloadHistoryEntity[]>([])
  const [isLoaded, setLoaded] = useState(false)

  const loadLatest = (count: number) =>
    downloadHistoryRepo.getLatest(count).then(setItems)

  useEffect(() => {
    loadLatest(50).then(() => setLoaded(true))
  }, [])

  return (
    <TableContainer maxH={'70vh'} whiteSpace={'break-spaces'} overflowY={'auto'}>
      <Table variant="striped" colorScheme="teal" size={'md'} width={'100%'}>
        <Thead position={'sticky'} top={0} zIndex={99} background={'black'}>
          <TableHeads />
        </Thead>
        <Tbody>
          {isLoaded ? (
            historyEntities.map((entity, i) => (
              <ItemRow key={i} item={entity.toDownloadHistoryItem()} />
            ))
          ) : (
            <LoadingBody />
          )}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

export default HistoryTable
