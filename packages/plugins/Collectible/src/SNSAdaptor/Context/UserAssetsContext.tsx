import { useWeb3ProfileHiddenSettings } from '@masknet/shared'
import { createIndicator, EMPTY_LIST, type NetworkPluginID, type PageIndicator } from '@masknet/shared-base'
import type { Web3Helper } from '@masknet/web3-helpers'
import { useWeb3Hub } from '@masknet/web3-hooks-base'
import { CollectionType } from '@masknet/web3-providers/types'
import {
    createContext,
    memo,
    type FC,
    type PropsWithChildren,
    useMemo,
    useCallback,
    useContext,
    useRef,
    useReducer,
    useEffect,
} from 'react'
import {
    assetsReducer,
    createAssetsState,
    type AssetsState,
    initialAssetsState,
    type AssetsReducerState,
} from './assetsReducer.js'

interface AssetsContextOptions {
    getAssets(id: string): AssetsState
    /** Get verified-by marketplaces */
    getVerifiedBy(id: string): string[]
    loadAssets(collection: Web3Helper.NonFungibleCollectionAll): Promise<void>
    loadVerifiedBy(id: string): Promise<void>
    isHiddenAddress: boolean
}

export const AssetsContext = createContext<AssetsContextOptions>({
    getAssets: () => ({ loading: false, finished: false, assets: [] }),
    getVerifiedBy: () => EMPTY_LIST,
    loadAssets: () => Promise.resolve(),
    loadVerifiedBy: () => Promise.resolve(),
    isHiddenAddress: false,
})

interface Props {
    pluginID: NetworkPluginID
    userAddress: string
    userId?: string
    persona?: string
}

const joinKeys = (ids: string[]) => ids.join('_').toLowerCase()

export const UserAssetsProvider: FC<PropsWithChildren<Props>> = memo(
    ({ pluginID, userId, userAddress, persona, children }) => {
        const [{ assetsMap, verifiedMap }, dispatch] = useReducer(assetsReducer, initialAssetsState)
        const indicatorMapRef = useRef<Record<string, PageIndicator | undefined>>({})
        const assetsMapRef = useRef<AssetsReducerState['assetsMap']>({})
        const verifiedMapRef = useRef<AssetsReducerState['verifiedMap']>({})
        useEffect(() => {
            assetsMapRef.current = assetsMap
            verifiedMapRef.current = verifiedMap
        })
        const { isHiddenAddress, hiddenList } = useWeb3ProfileHiddenSettings(userId?.toLowerCase(), persona, {
            address: userAddress,
            hiddenAddressesKey: 'NFTs',
            collectionKey: CollectionType.NFTs,
        })

        // A mapping that contains listing assets only
        const listingAssetsMap = useMemo(() => {
            if (!hiddenList.length) return assetsMap
            const listingMap: Record<string, AssetsState> = { ...assetsMap }
            let updated = false
            for (const id in assetsMap) {
                const originalAssets = assetsMap[id].assets
                const newAssets = originalAssets.filter((x) => !hiddenList.includes(joinKeys([x.address, x.tokenId])))
                if (newAssets.length === originalAssets.length) {
                    listingMap[id] = { ...listingMap[id], assets: newAssets }
                    updated = true
                }
            }
            // Update accordingly
            return updated ? listingMap : assetsMap
        }, [assetsMap, hiddenList])

        const hub = useWeb3Hub(pluginID)
        const loadAssets = useCallback(
            async (collection: Web3Helper.NonFungibleCollectionAll) => {
                if (!collection.id) return
                const { id, chainId } = collection
                const assetsState = assetsMapRef.current[id]
                if (!hub?.getNonFungibleAssetsByCollectionAndOwner || assetsState?.finished || assetsState?.loading)
                    return
                // Fetch less in collection list, and more every time in expanded collection
                const size = assetsState?.assets.length ? 20 : 4
                const indicator = indicatorMapRef.current[id] || createIndicator()
                dispatch({ type: 'SET_LOADING_STATUS', id, loading: true })
                const pageable = await hub.getNonFungibleAssetsByCollectionAndOwner(id, userAddress, {
                    indicator,
                    size,
                    chainId,
                })
                const finished = !pageable.nextIndicator
                if (pageable.nextIndicator) {
                    indicatorMapRef.current[id] = pageable.nextIndicator as PageIndicator
                }
                dispatch({ type: 'APPEND_ASSETS', id, assets: pageable.data })
                dispatch({ type: 'SET_LOADING_STATUS', id, finished, loading: false })
            },
            [hub, userAddress],
        )
        const loadVerifiedBy = useCallback(
            async (id: string) => {
                const verifiedState = verifiedMapRef.current[id]
                if (!hub?.getNonFungibleCollectionVerifiedBy || verifiedState || !id) return
                const verifiedBy = await hub.getNonFungibleCollectionVerifiedBy(id)
                dispatch({ type: 'SET_VERIFIED', id, verifiedBy })
            },
            [hub?.getNonFungibleCollectionVerifiedBy],
        )

        const getAssets = useCallback((id: string) => listingAssetsMap[id] ?? createAssetsState(), [listingAssetsMap])
        const getVerifiedBy = useCallback((id: string) => verifiedMap[id] ?? EMPTY_LIST, [verifiedMap])
        const contextValue = useMemo((): AssetsContextOptions => {
            return {
                isHiddenAddress,
                getAssets,
                getVerifiedBy,
                loadAssets,
                loadVerifiedBy,
            }
        }, [isHiddenAddress, getAssets, getVerifiedBy, loadAssets, loadVerifiedBy])
        return <AssetsContext.Provider value={contextValue}>{children}</AssetsContext.Provider>
    },
)

export function useUserAssets() {
    return useContext(AssetsContext)
}

UserAssetsProvider.displayName = 'UserAssetsProvider'