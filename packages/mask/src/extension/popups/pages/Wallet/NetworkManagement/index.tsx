import { Flags } from '@masknet/flags'
import { Icons } from '@masknet/icons'
import { Icon, WalletIcon } from '@masknet/shared'
import { PopupRoutes } from '@masknet/shared-base'
import { ActionButton, makeStyles } from '@masknet/theme'
import { Box, List, ListItem, Typography, alpha } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { WalletRPC } from '../../../../../plugins/WalletService/messages.js'
import { getEvmNetworks, useI18N } from '../../../../../utils/index.js'
import { useTitle } from '../../../hook/index.js'

const useStyles = makeStyles()((theme) => ({
    main: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
    },
    list: {
        overflow: 'auto',
        padding: theme.spacing(2),
        flexGrow: 1,
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    network: {
        borderRadius: 8,
        border: `1px solid ${theme.palette.maskColor.line}`,
        height: theme.spacing(6),
        padding: theme.spacing(1.5),
        boxSizing: 'border-box',
        marginBottom: theme.spacing(2),
        cursor: 'pointer',
    },
    text: {
        marginLeft: theme.spacing(1),
        marginRight: 'auto',
        display: 'flex',
        alignItems: 'center',
    },
    name: {
        marginRight: theme.spacing(0.5),
        fontSize: 12,
        color: theme.palette.maskColor.main,
        fontWeight: 700,
        lineHeight: '16px',
    },
    footer: {
        padding: theme.spacing(2),
        borderRadius: 12,
        background: alpha(theme.palette.maskColor.bottom, 0.8),
        boxShadow: theme.palette.maskColor.bottomBg,
        backdropFilter: 'blur(8px)',
    },
}))

export const NetworkManagement = memo(function NetworkManagement() {
    const { t } = useI18N()
    const { classes, theme } = useStyles()
    const navigate = useNavigate()
    useTitle(t('management_network'))

    const networks = useMemo(() => getEvmNetworks(Flags.support_testnet_switch), [])
    const { data: customizedNetworks = [] } = useQuery(['system', 'wallet', 'networks'], () => WalletRPC.getNetworks())

    return (
        <main className={classes.main}>
            <List className={classes.list}>
                {[...networks, ...customizedNetworks].map((network) => {
                    // Only NetworkDescriptor has `icon`
                    const isBuiltIn = 'icon' in network
                    const id = 'id' in network ? network.id : network.chainId
                    return (
                        <ListItem
                            key={id}
                            className={classes.network}
                            role="link"
                            onClick={() => {
                                navigate(`${PopupRoutes.EditNetwork}/${id}`)
                            }}>
                            {isBuiltIn ? (
                                <WalletIcon size={24} mainIcon={network.icon} />
                            ) : (
                                <Icon size={24} name={network.name} AvatarProps={{ sx: { fontSize: 12 } }} />
                            )}
                            <Box className={classes.text}>
                                <Typography className={classes.name}>{network.name}</Typography>
                                {isBuiltIn ? <Icons.Lock size={16} /> : null}
                            </Box>
                            <Icons.RightArrow color={theme.palette.maskColor.second} size={20} />
                        </ListItem>
                    )
                })}
            </List>
            <div className={classes.footer}>
                <ActionButton fullWidth onClick={() => navigate(PopupRoutes.AddNetwork)}>
                    {t('network_management_add_network')}
                </ActionButton>
            </div>
        </main>
    )
})
