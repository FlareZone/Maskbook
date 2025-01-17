import { Flags } from '@masknet/flags'
import { ChainIcon, CopyButton, FormattedAddress, ImageIcon, TokenIcon } from '@masknet/shared'
import { type NetworkPluginID } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { useChainContext } from '@masknet/web3-hooks-base'
import { formatEthereumAddress, isNativeTokenAddress } from '@masknet/web3-shared-evm'
import { Box, Typography } from '@mui/material'
import { memo, useMemo } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { useParams } from 'react-router-dom'
import { getEvmNetworks, useI18N } from '../../../../../utils/index.js'
import { useTitle } from '../../../hook/index.js'

const useStyles = makeStyles()((theme) => {
    const isDark = theme.palette.mode === 'dark'
    return {
        header: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: theme.spacing(2),
        },
        network: {
            color: theme.palette.maskColor.main,
            marginTop: theme.spacing(1),
            fontSize: 24,
            fontWeight: 700,
        },
        address: {
            color: theme.palette.maskColor.second,
            marginTop: theme.spacing(1),
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
        },
        qrcode: {
            width: 250,
            height: 250,
            boxShadow: theme.palette.maskColor.bottomBg,
            borderRadius: theme.spacing(2),
            overflow: 'hidden',
        },
        halo: {
            position: 'relative',
            zIndex: 2,
            overflow: 'hidden',
            '&:before': {
                position: 'absolute',
                left: '-10%',
                top: 10,
                zIndex: 1,
                content: '""',
                height: 256,
                width: 256,
                backgroundImage: isDark
                    ? 'radial-gradient(50% 50.00% at 50% 50.00%, #443434 0%, rgba(68, 52, 52, 0.00) 100%)'
                    : 'radial-gradient(50% 50.00% at 50% 50.00%, #FFE9E9 0%, rgba(255, 233, 233, 0.00) 100%)',
            },
            '&:after': {
                position: 'absolute',
                left: '70%',
                top: 20,
                zIndex: 1,
                content: '""',
                height: 256,
                width: 256,
                backgroundImage: isDark
                    ? 'radial-gradient(50% 50.00% at 50% 50.00%, #605675 0%, rgba(56, 51, 67, 0.00) 100%)'
                    : 'radial-gradient(50% 50.00% at 50% 50.00%, #F0E9FF 0%, rgba(240, 233, 255, 0.00) 100%)',
            },
        },
        qrcodeContainer: {
            width: 282,
            margin: theme.spacing(2, 'auto', 0),
            padding: theme.spacing(2),
            backgroundColor: theme.palette.maskColor.bottom,
            position: 'relative',
            zIndex: 10,
        },
        tip: {
            fontSize: 16,
            marginTop: 10,
            textAlign: 'center',
            color: theme.palette.maskColor.second,
        },
    }
})

export default memo(function Receive() {
    const { classes } = useStyles()
    const { t } = useI18N()
    const { chainId, account } = useChainContext<NetworkPluginID.PLUGIN_EVM>()
    const { address } = useParams()
    const networks = useMemo(() => {
        return getEvmNetworks(Flags.support_testnet_switch).filter((x) =>
            Flags.support_testnet_switch ? true : x.isMainnet,
        )
    }, [])

    useTitle(t('wallet_receive'))

    const currentNetwork = useMemo(() => networks.find((x) => x.chainId === chainId) ?? networks[0], [chainId])
    return (
        <Box>
            <Box className={classes.header}>
                {address && !isNativeTokenAddress(address) ? (
                    <TokenIcon address={address} />
                ) : currentNetwork.isMainnet ? (
                    <ImageIcon size={60} icon={currentNetwork.icon} />
                ) : (
                    <ChainIcon size={60} name={currentNetwork.name} />
                )}
                <Typography className={classes.network}>{currentNetwork.name}</Typography>
                <Typography className={classes.address}>
                    <FormattedAddress address={account} formatter={formatEthereumAddress} size={4} />
                    <CopyButton text={account} size={24} ml={2} style={{ marginLeft: 16 }} />
                </Typography>
            </Box>
            <div className={classes.halo}>
                <div className={classes.qrcodeContainer}>
                    <Box className={classes.qrcode}>
                        <QRCode value={account} ecLevel="L" size={220} quietZone={16} eyeRadius={100} qrStyle="dots" />
                    </Box>
                </div>
            </div>
            <Typography className={classes.tip}>{t('scan_address_to_payment')}</Typography>
        </Box>
    )
})
