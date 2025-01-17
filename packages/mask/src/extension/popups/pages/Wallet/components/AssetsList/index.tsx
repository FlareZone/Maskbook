import { Icons } from '@masknet/icons'
import { FormattedBalance, ImageIcon, TokenIcon } from '@masknet/shared'
import { NetworkPluginID, PopupRoutes } from '@masknet/shared-base'
import { ActionButton, makeStyles, type ActionButtonProps } from '@masknet/theme'
import { useNetworkDescriptors } from '@masknet/web3-hooks-base'
import { formatBalance, formatCurrency, isGte, isLessThan, type FungibleAsset } from '@masknet/web3-shared-base'
import { isNativeTokenAddress, type ChainId, type SchemaType } from '@masknet/web3-shared-evm'
import { Box, List, ListItem, ListItemIcon, ListItemText, Skeleton, Typography } from '@mui/material'
import { isNaN, range } from 'lodash-es'
import { memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContainer } from 'unstated-next'
import urlcat from 'urlcat'
import { useI18N } from '../../../../../../utils/index.js'
import { WalletContext } from '../../hooks/useWalletContext.js'

const useStyles = makeStyles()((theme) => ({
    list: {
        backgroundColor: theme.palette.maskColor.bottom,
        padding: theme.spacing(2),
    },
    item: {
        padding: 14,
        cursor: 'pointer',
        borderRadius: 8,
        '&:hover': {
            backgroundColor: theme.palette.maskColor.bg,
        },
        '&:not(:last-of-type)': {
            marginBottom: theme.spacing(1),
        },
    },
    tokenIcon: {
        width: 36,
        height: 36,
    },
    badgeIcon: {
        position: 'absolute',
        right: -6,
        bottom: -4,
        border: `1px solid ${theme.palette.common.white}`,
        borderRadius: '50%',
    },
    text: {
        marginLeft: 14,
        fontSize: 16,
        fontWeight: 700,
        color: theme.palette.maskColor.main,
    },
    value: {
        fontSize: 16,
        fontWeight: 700,
    },
    more: {
        display: 'inline-flex',
        width: 'auto',
        margin: theme.spacing(0, 'auto', 2),
    },
}))

type Asset = FungibleAsset<ChainId, SchemaType>

export const AssetsList = memo(function AssetsList() {
    const { classes } = useStyles()
    const navigate = useNavigate()
    const { assets, assetsLoading, setCurrentToken, assetsIsExpand, setAssetsIsExpand } = useContainer(WalletContext)
    const onItemClick = useCallback((asset: Asset) => {
        setCurrentToken(asset)
        navigate(urlcat(PopupRoutes.TokenDetail, { chainId: asset.chainId, address: asset.address }))
    }, [])
    const onSwitch = useCallback(() => setAssetsIsExpand((x) => !x), [])

    const hasLowValueToken = useMemo(() => {
        return !!assets.find((x) =>
            !isNativeTokenAddress(x.address) && x.value?.usd ? isLessThan(x.value.usd, 1) : true,
        )
    }, [assets])
    return (
        <>
            {assetsLoading ? (
                <AssetsListSkeleton />
            ) : (
                <AssetsListUI isExpand={assetsIsExpand} assets={assets} onItemClick={onItemClick} />
            )}
            <MoreBar
                isExpand={assetsIsExpand}
                hasLowValueToken={hasLowValueToken}
                onClick={onSwitch}
                className={classes.more}
            />
        </>
    )
})

export interface MoreBarProps extends ActionButtonProps {
    isExpand: boolean
    hasLowValueToken?: boolean
}

export const MoreBar = memo<MoreBarProps>(function MoreBar({ isExpand, hasLowValueToken, ...rest }) {
    const { t } = useI18N()
    if (!hasLowValueToken) return null
    if (isExpand)
        return (
            <ActionButton variant="roundedOutlined" {...rest}>
                <span>{t('popups_wallet_more_collapse')}</span>
                <Icons.ArrowDrop style={{ transform: 'rotate(180deg)' }} />
            </ActionButton>
        )
    return (
        <ActionButton variant="roundedOutlined" {...rest}>
            <span>{t('popups_wallet_more_expand')}</span>
            <Icons.ArrowDrop />
        </ActionButton>
    )
})

export interface AssetsListUIProps {
    isExpand: boolean
    assets: Asset[]
    onItemClick: (token: Asset) => void
}

export const AssetsListUI = memo<AssetsListUIProps>(function AssetsListUI({ isExpand, assets, onItemClick }) {
    const { classes } = useStyles()
    const list = assets.filter(
        (asset) => isExpand || isNativeTokenAddress(asset.address) || isGte(asset.value?.usd ?? 0, 1),
    )
    const descriptors = useNetworkDescriptors(NetworkPluginID.PLUGIN_EVM)
    return (
        <List dense className={classes.list}>
            {list.map((asset) => {
                const networkDescriptor = descriptors.find((x) => x.chainId === asset.chainId)
                return (
                    <ListItem
                        key={`${asset.chainId}.${asset.address}`}
                        className={classes.item}
                        onClick={() => onItemClick(asset)}
                        secondaryAction={
                            <Typography className={classes.value}>
                                {formatCurrency(asset.value?.usd || 0, 'USD', { onlyRemainTwoDecimal: true })}
                            </Typography>
                        }>
                        <ListItemIcon>
                            <Box position="relative">
                                <TokenIcon
                                    className={classes.tokenIcon}
                                    address={asset.address}
                                    name={asset.name}
                                    chainId={asset.chainId}
                                    logoURL={asset.logoURL}
                                    size={36}
                                />
                                <ImageIcon className={classes.badgeIcon} size={16} icon={networkDescriptor?.icon} />
                            </Box>
                        </ListItemIcon>
                        <ListItemText
                            className={classes.text}
                            secondary={
                                <Typography>
                                    <FormattedBalance
                                        value={isNaN(asset.balance) ? 0 : asset.balance}
                                        decimals={isNaN(asset.decimals) ? 0 : asset.decimals}
                                        symbol={asset.symbol}
                                        significant={6}
                                        formatter={formatBalance}
                                    />
                                </Typography>
                            }>
                            {asset.name}
                        </ListItemText>
                    </ListItem>
                )
            })}
        </List>
    )
})

const AssetsListSkeleton = memo(function AssetsListSkeleton() {
    const { classes } = useStyles()
    return (
        <List dense className={classes.list}>
            {range(4).map((i) => (
                <ListItem
                    key={i}
                    className={classes.item}
                    secondaryAction={
                        <Typography className={classes.value}>
                            <Skeleton width={60} />
                        </Typography>
                    }>
                    <ListItemIcon>
                        <Box position="relative">
                            <Skeleton variant="circular" className={classes.tokenIcon} />
                            <Skeleton variant="circular" width={16} height={16} className={classes.badgeIcon} />
                        </Box>
                    </ListItemIcon>
                    <ListItemText
                        className={classes.text}
                        secondary={
                            <Typography>
                                <Skeleton width={100} />
                            </Typography>
                        }>
                        <Skeleton width={90} />
                    </ListItemText>
                </ListItem>
            ))}
        </List>
    )
})
