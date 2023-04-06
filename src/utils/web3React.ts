import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { BscConnector } from '@binance-chain/bsc-connector'
import { ConnectorNames } from '@pancakeswap/uikit'
import Web3 from 'web3'
import getNodeUrl, { bitkeepLocalhost } from './getRpcUrl'

const POLLING_INTERVAL = 12000
const rpcUrl = getNodeUrl()
const chainId = parseInt(process.env.REACT_APP_CHAIN_ID, 10)

const injected = new InjectedConnector({ supportedChainIds: [chainId] })

const walletconnect = new WalletConnectConnector({
  rpc: { [chainId]: rpcUrl },
  bridge: 'https://pancakeswap.bridge.walletconnect.org/',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
})

const bscConnector = new BscConnector({ supportedChainIds: [chainId] })

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.BSC]: bscConnector,
}

export const getLibrary = (provider): Web3 => {
  
  // Change Bitkeep wallet RPC url
  if(
    provider
    &&
    provider.rpc
    && 
    (window as WindowChain)?.bitkeep
    &&
    (window as WindowChain)?.bitkeep?.ethereum?.isBitKeep
    &&
    (window as WindowChain)?.bitkeep
    &&
    (window as WindowChain).bitkeep?.ethereum?.isBitEthereum

    ){
      if(provider.rpc.rpcUrl === bitkeepLocalhost){
        // eslint-disable-next-line no-param-reassign
        provider.rpc.rpcUrl = getNodeUrl()
      }
  }
  return provider
}
