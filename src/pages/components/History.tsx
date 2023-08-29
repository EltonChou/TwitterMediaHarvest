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
import type { DownloadHistoryItem } from '@schema'
import React, { memo, useEffect, useState } from 'react'
import { BiDownload, BiLinkExternal } from 'react-icons/bi'

type ItemActionsProps = {
  tweetId: string
  screenName: string
}

const ItemActions = memo((props: ItemActionsProps) => (
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
))

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
      <Text whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'}>
        {props.name}
      </Text>
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

const ItemRow = (props: ItemRowProps) => (
  <Tr>
    <Td>
      <ItemThumbnail url={props.item.thumbnail} />
    </Td>
    <Td minW={'20ch'} maxW={'40ch'}>
      <ItemUser
        id={props.item.userId}
        name={props.item.displayName}
        account={props.item.screenName}
      />
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
      <Skeleton width={'30ch'}>
        <Text>The user name could be up to 50 characters.</Text>
      </Skeleton>
      <Skeleton width={'15ch'} mt="1">
        <Text>Could be up to 15.</Text>
      </Skeleton>
    </Td>
    <Td>
      <Skeleton>{new Date().toLocaleString()}</Skeleton>
    </Td>
    <Td>
      <Skeleton>{new Date().toLocaleString()}</Skeleton>
    </Td>
    <Td>
      <Skeleton>
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

  useEffect(() => {
    downloadHistoryRepo
      .getLatest(50)
      .then(setItems)
      .then(() => setLoaded(true))
  }, [])

  return (
    <Box overflow={'auto'} maxH={'70vh'}>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size={'md'} width={'100%'}>
          <Thead>
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
    </Box>
  )
}

export default HistoryTable
