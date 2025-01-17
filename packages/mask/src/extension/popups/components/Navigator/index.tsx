// ! This file is used during SSR. DO NOT import new files that does not work in SSR

import { memo } from 'react'
import { NavLink, type LinkProps } from 'react-router-dom'
import { BottomNavigation, BottomNavigationAction, Box, type BoxProps } from '@mui/material'
import { Icons } from '@masknet/icons'
import { makeStyles } from '@masknet/theme'
import { PopupRoutes } from '@masknet/shared-base'
import { useWallet } from '@masknet/web3-hooks-base'
import { useHasPassword } from '../../hook/useHasPassword.js'
import { useWalletLockStatus } from '../../pages/Wallet/hooks/useWalletLockStatus.js'

const useStyle = makeStyles()((theme) => ({
    navigation: {
        height: 72,
        padding: '0 18px',
        background: theme.palette.maskColor.secondaryBottom,
        boxShadow: theme.palette.maskColor.bottomBg,
        backdropFilter: 'blur(8px)',
    },
    iconOnly: {
        color: theme.palette.maskColor.third,
        height: '100%',
    },
    selected: {
        '& > button': {
            color: theme.palette.maskColor.highlight,
            filter: 'drop-shadow(0px 4px 10px rgba(0, 60, 216, 0.2))',
        },
    },
    container: {
        backgroundColor: theme.palette.maskColor.bottom,
        width: '100%',
        backdropFilter: 'blur(8px)',
    },
}))

const BottomNavLink = memo<LinkProps>(function BottomNavLink({ children, to }) {
    const { classes } = useStyle()

    return (
        <NavLink to={to} className={({ isActive }) => (isActive ? classes.selected : undefined)}>
            {children}
        </NavLink>
    )
})

export const Navigator = memo(function Navigator({ className, ...rest }: BoxProps) {
    const { classes, cx } = useStyle()

    const wallet = useWallet()

    const { isLocked, loading: getLockStatusLoading } = useWalletLockStatus()

    const { hasPassword, loading: getHasPasswordLoading } = useHasPassword()

    const walletPageLoading = getLockStatusLoading || getHasPasswordLoading
    return (
        <Box className={cx(classes.container, className)} {...rest}>
            <BottomNavigation classes={{ root: classes.navigation }}>
                <BottomNavLink to={PopupRoutes.Personas}>
                    <BottomNavigationAction
                        showLabel={false}
                        icon={<Icons.Me size={24} />}
                        className={classes.iconOnly}
                    />
                </BottomNavLink>
                {walletPageLoading ? (
                    <BottomNavigationAction
                        showLabel={false}
                        icon={<Icons.WalletNav size={24} />}
                        className={classes.iconOnly}
                    />
                ) : (
                    <BottomNavLink
                        to={
                            !wallet
                                ? PopupRoutes.Wallet
                                : isLocked
                                ? PopupRoutes.Unlock
                                : !hasPassword
                                ? PopupRoutes.SetPaymentPassword
                                : PopupRoutes.Wallet
                        }>
                        <BottomNavigationAction
                            showLabel={false}
                            icon={<Icons.WalletNav size={24} />}
                            className={classes.iconOnly}
                        />
                    </BottomNavLink>
                )}
                <BottomNavLink to={PopupRoutes.Contracts}>
                    <BottomNavigationAction
                        showLabel={false}
                        icon={<Icons.Contacts size={24} />}
                        className={classes.iconOnly}
                    />
                </BottomNavLink>
                <BottomNavLink to={PopupRoutes.Settings}>
                    <BottomNavigationAction
                        showLabel={false}
                        icon={<Icons.Settings2 size={24} />}
                        className={classes.iconOnly}
                    />
                </BottomNavLink>
            </BottomNavigation>
        </Box>
    )
})
