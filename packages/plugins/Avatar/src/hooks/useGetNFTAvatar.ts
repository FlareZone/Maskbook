import { useCallback } from 'react'
import { NetworkPluginID, type EnhanceableSite } from '@masknet/shared-base'
import { useGetAddress } from './useGetAddress.js'
import { useGetNFTAvatarFromStorage } from './storage/useGetNFTAvatarFromStorage.js'
import { useWeb3State } from '@masknet/web3-hooks-base'
import { NFT_AVATAR_METADATA_STORAGE, type RSS3_KEY_SNS } from '../constants.js'
import type { NextIDAvatarMeta } from '../types.js'
import { useGetNFTAvatarFromRSS3 } from './rss3/index.js'

export function useGetNFTAvatar() {
    const getNFTAvatarFromRSS = useGetNFTAvatarFromRSS3()
    const getNFTAvatarFromStorage = useGetNFTAvatarFromStorage()
    const getAddress = useGetAddress()
    const { Storage } = useWeb3State()
    return useCallback(
        async (userId?: string, network?: EnhanceableSite, snsKey?: RSS3_KEY_SNS) => {
            if (!userId || !network || !snsKey) return
            const addressStorage = await getAddress(network, userId)
            if (!addressStorage?.address) return
            if (addressStorage?.networkPluginID && addressStorage.networkPluginID !== NetworkPluginID.PLUGIN_EVM) {
                return Storage?.createKVStorage(`${NFT_AVATAR_METADATA_STORAGE}_${network}`).get<NextIDAvatarMeta>(
                    userId,
                )
            }
            const user = await getNFTAvatarFromStorage(userId, addressStorage.address)
            if (user) return user
            return getNFTAvatarFromRSS(userId, addressStorage.address, snsKey)
        },
        [getNFTAvatarFromStorage, getAddress, Storage, getNFTAvatarFromRSS],
    )
}
