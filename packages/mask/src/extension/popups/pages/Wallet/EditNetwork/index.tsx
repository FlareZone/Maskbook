import { zodResolver } from '@hookform/resolvers/zod'
import { Icons } from '@masknet/icons'
import { delay } from '@masknet/kit'
import { queryClient } from '@masknet/shared-base-ui'
import { ActionButton, makeStyles, usePopupCustomSnackbar } from '@masknet/theme'
import { chainResolver, explorerResolver, getRPCConstant } from '@masknet/web3-shared-evm'
import { Button, Input, Typography, alpha } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { omit } from 'lodash-es'
import { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { type ZodCustomIssue, type z } from 'zod'
import { WalletRPC } from '../../../../../plugins/WalletService/messages.js'
import { createSchema, getEvmNetworks, useI18N, type AvailableLocaleKeys } from '../../../../../utils/index.js'
import { PageTitleContext } from '../../../context.js'
import { useTitle } from '../../../hook/index.js'

const useStyles = makeStyles()((theme) => ({
    main: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
    },
    form: {
        overflow: 'auto',
        flexGrow: 1,
        padding: theme.spacing(0, 2, 2),
    },
    iconButton: {
        padding: 0,
        minWidth: 'auto',
        width: 'auto',
    },
    footer: {
        padding: theme.spacing(2),
        borderRadius: 12,
        background: alpha(theme.palette.maskColor.bottom, 0.8),
        boxShadow: theme.palette.maskColor.bottomBg,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
    },
    label: {
        color: theme.palette.maskColor.second,
        marginBottom: theme.spacing(0.5),
        marginTop: theme.spacing(2),
    },
    error: {
        color: theme.palette.maskColor.danger,
        marginTop: theme.spacing(0.5),
    },
    warn: {
        color: theme.palette.maskColor.main,
        marginTop: theme.spacing(0.5),
    },
}))

const QUERY_KEY = ['system', 'wallet', 'networks']
export const EditNetwork = memo(function EditNetwork() {
    const { t } = useI18N()
    const { classes } = useStyles()
    const navigate = useNavigate()
    const id = useParams<{ id: string }>().id
    const chainId = id?.match(/^\d+$/) ? Number.parseInt(id, 10) : undefined
    const isEditing = !!id && !chainId

    // #region Get network
    const networks = useMemo(() => getEvmNetworks(true), [])
    const builtInNetwork = useMemo(() => {
        if (!chainId) return null
        const network = networks.find((x) => x.chainId === chainId)
        if (!network) return null
        return {
            name: network.name,
            chainId,
            rpc: getRPCConstant(network.chainId, 'RPC_URLS')?.[0],
            currencySymbol: chainResolver.nativeCurrency(network.chainId)?.symbol,
            explorer: explorerResolver.explorerURL(network.chainId).url,
        }
    }, [chainId, networks])
    const { data: storedNetworks = [] } = useQuery({
        enabled: !builtInNetwork && !!chainId,
        queryKey: ['system', 'wallet', 'networks'],
        queryFn: () => WalletRPC.getNetworks(),
    })
    const storedNetwork = storedNetworks.find((x) => x.id === id)
    const network = builtInNetwork || storedNetwork
    // #endregion

    const { showSnackbar } = usePopupCustomSnackbar()
    useTitle(network ? network.name : t('network_management_add_network'))
    const { setExtension } = useContext(PageTitleContext)

    const isBuiltIn = !!builtInNetwork
    useEffect(() => {
        if (isBuiltIn || !id) return
        setExtension(
            <Button
                variant="text"
                className={classes.iconButton}
                onClick={async () => {
                    await WalletRPC.deleteNetwork(id)
                    showSnackbar(t('deleted_network_successfully'))
                    // Trigger UI update.
                    queryClient.invalidateQueries(QUERY_KEY)
                    navigate(-1)
                }}>
                <Icons.Trash size={24} />
            </Button>,
        )
        return () => setExtension(undefined)
    }, [isBuiltIn, id, classes.iconButton, showSnackbar, t])

    const schema = useMemo(() => {
        return createSchema(t, async (name) => {
            const networks = await WalletRPC.getNetworks()
            return !networks.find((network) => network.name === name && network.id !== id)
        })
    }, [t, id])

    type FormInputs = z.infer<typeof schema>
    const {
        getValues,
        register,
        setError,
        formState: { errors, isValidating, isDirty },
    } = useForm<FormInputs>({
        mode: 'all',
        resolver: zodResolver(schema),
        defaultValues: network,
    })
    const checkZodError = useCallback(
        (message: string) => {
            try {
                const issues = JSON.parse(message) as ZodCustomIssue[]
                const isInvalid = issues.some((issue) => issue.path[0] !== 'currencySymbol')
                if (!isInvalid) return true
                issues.forEach((issue) => {
                    // We assume there is no multiple paths.
                    setError(issue.path[0] as keyof FormInputs, {
                        message: t(issue.message as AvailableLocaleKeys, issue.params),
                    })
                })
            } catch {}
            return false
        },
        [setError, t],
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { isLoading: isMutating, mutate } = useMutation<void, unknown, FormInputs>({
        mutationFn: async (data) => {
            setIsSubmitting(true)
            try {
                if (isEditing) {
                    if (data.chainId !== chainId) {
                        await WalletRPC.deleteNetwork(id)
                        await delay(100)
                        await WalletRPC.addNetwork(data)
                    } else {
                        await WalletRPC.updateNetwork(id, { ...data, id })
                    }
                    showSnackbar(t('saved_network_successfully'))
                } else {
                    await WalletRPC.addNetwork(data)
                    showSnackbar(t('adding_network_successfully'))
                }
                navigate(-1)
                queryClient.invalidateQueries(QUERY_KEY)
            } catch (err) {
                checkZodError((err as Error).message)
                showSnackbar(t('failed_to_save_network'))
            }
            setIsSubmitting(false)
        },
    })

    const [isChecking, setIsChecking] = useState(false)
    // Discard currencySymbol warning
    const isValid = Object.keys(omit(errors, 'currencySymbol')).length === 0
    const isNotReady = isValidating || (!isValidating && !isValid) || !isDirty || isChecking
    const disabled = isNotReady || isMutating || isSubmitting

    // currency symbol error is tolerable,
    // but react-hook-form's handleSubmit can't tolerate it
    const handleSubmit = useCallback(async () => {
        if (disabled) return
        setIsChecking(true)
        const data = getValues()
        const result = await schema.parseAsync(data).then(
            () => true,
            (err) => checkZodError((err as Error).message),
        )
        setIsChecking(false)
        if (!result) return
        mutate(data)
    }, [disabled, getValues, isEditing])

    return (
        <main className={classes.main}>
            <form className={classes.form}>
                <Typography className={classes.label}>{t('network_name')}</Typography>
                <Input
                    fullWidth
                    disableUnderline
                    error={!!errors.name}
                    {...register('name')}
                    placeholder="Cel"
                    disabled={isBuiltIn}
                />
                {errors.name ? <Typography className={classes.error}>{errors.name.message}</Typography> : null}

                <Typography className={classes.label}>{t('rpc_url')}</Typography>
                <Input
                    fullWidth
                    disableUnderline
                    error={!!errors.rpc}
                    {...register('rpc')}
                    placeholder="https://"
                    disabled={isBuiltIn}
                />
                {errors.rpc ? <Typography className={classes.error}>{errors.rpc.message}</Typography> : null}

                <Typography className={classes.label}>{t('chain_id')}</Typography>
                <Input
                    fullWidth
                    disableUnderline
                    error={!!errors.chainId}
                    {...register('chainId')}
                    placeholder="eg. 2"
                    disabled={isBuiltIn}
                />
                {errors.chainId ? <Typography className={classes.error}>{errors.chainId.message}</Typography> : null}

                <Typography className={classes.label}>{t('optional_currency_symbol')}</Typography>
                <Input
                    fullWidth
                    disableUnderline
                    error={!!errors.currencySymbol}
                    {...register('currencySymbol', { required: false })}
                    placeholder="eg. ETH"
                    disabled={isBuiltIn}
                />
                {errors.currencySymbol ? (
                    <Typography className={classes.warn}>{errors.currencySymbol.message}</Typography>
                ) : null}

                <Typography className={classes.label}>{t('optional_block_explorer_url')}</Typography>
                <Input
                    fullWidth
                    disableUnderline
                    {...register('explorer')}
                    placeholder="https://"
                    disabled={isBuiltIn}
                />
                {errors.explorer ? <Typography className={classes.error}>{errors.explorer.message}</Typography> : null}
            </form>
            {!isBuiltIn ? (
                <div className={classes.footer}>
                    <ActionButton fullWidth variant="outlined" onClick={() => navigate(-1)}>
                        {t('cancel')}
                    </ActionButton>
                    <ActionButton fullWidth onClick={handleSubmit} disabled={disabled}>
                        {t('confirm')}
                    </ActionButton>
                </div>
            ) : null}
        </main>
    )
})
