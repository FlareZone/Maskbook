import urlcat from 'urlcat'
import type { NonFungibleCollectionResult, SearchResult, SourceType } from '@masknet/web3-shared-base'
import { fetchJSON } from '../../helpers/fetchJSON.js'
import type { DSearchBaseAPI } from '../../types/DSearch.js'
import { DSEARCH_BASE_URL } from '../../DSearch/constants.js'

export interface FungibleToken {
    id: string | number
    name: string
    symbol: string
    sourceType: SourceType
}

export interface NonFungibleToken {
    address: string
    name: string
    chain: string
}

export class NFTScanSearchAPI<ChainId, SchemaType> implements DSearchBaseAPI.DataSourceProvider<ChainId, SchemaType> {
    async get(): Promise<Array<SearchResult<ChainId, SchemaType>>> {
        const nftsURL = urlcat(DSEARCH_BASE_URL, '/non-fungible-tokens/nftscan.json', { mode: 'cors' })
        const collectionsURL = urlcat(DSEARCH_BASE_URL, '/non-fungible-collections/nftscan.json', { mode: 'cors' })
        const nfts = fetchJSON<Array<SearchResult<ChainId, SchemaType>>>(nftsURL)
        const collections = fetchJSON<Array<SearchResult<ChainId, SchemaType>>>(collectionsURL)
        const collectionsFromSpecialList = await fetchJSON<Array<SearchResult<ChainId, SchemaType>>>(
            urlcat(DSEARCH_BASE_URL, '/non-fungible-collections/specific-list.json', { mode: 'cors' }),
        )
        return (await Promise.allSettled([collectionsFromSpecialList, nfts, collections])).flatMap((v) =>
            v.status === 'fulfilled' && v.value ? v.value : [],
        )
    }
}

export class NFTScanCollectionSearchAPI<ChainId, SchemaType>
    implements DSearchBaseAPI.DataSourceProvider<ChainId, SchemaType>
{
    async get(): Promise<Array<NonFungibleCollectionResult<ChainId, SchemaType>>> {
        const collectionsURL = urlcat(DSEARCH_BASE_URL, '/non-fungible-collections/nftscan.json', { mode: 'cors' })
        const collectionsFromSpecialList = await fetchJSON<Array<NonFungibleCollectionResult<ChainId, SchemaType>>>(
            urlcat(DSEARCH_BASE_URL, '/non-fungible-collections/specific-list.json', { mode: 'cors' }),
        )
        const collections = await fetchJSON<Array<NonFungibleCollectionResult<ChainId, SchemaType>>>(collectionsURL)
        return (await Promise.allSettled([collectionsFromSpecialList, collections])).flatMap((v) =>
            v.status === 'fulfilled' && v.value ? v.value : [],
        )
    }
}
