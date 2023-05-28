import type { Plugin } from '@masknet/plugin-infra'
import type {
    ChainId,
    NetworkType,
    ProviderType,
    SchemaType,
    Transaction,
    TransactionParameter,
} from '@masknet/web3-shared-solana'
import { SharedUIPluginContext, SolanaWeb3State } from '@masknet/web3-providers'
import { base } from '../../base.js'

const dashboard: Plugin.Dashboard.Definition<
    ChainId,
    SchemaType,
    ProviderType,
    NetworkType,
    Transaction,
    TransactionParameter
> = {
    ...base,
    async init(signal, context) {
        SharedUIPluginContext.setup(context)

        const state = await SolanaWeb3State.create(context)

        SolanaWeb3State.setup(state)
        dashboard.Web3State = SolanaWeb3State.state
    },
}

export default dashboard
