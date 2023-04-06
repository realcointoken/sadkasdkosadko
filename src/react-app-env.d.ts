/// <reference types="react-scripts" />

interface WindowChain {
  bitkeep?: {
    ethereum?: {
      isMetaMask?: true
      request?: (...args: any[]) => void
      isBitKeep?: boolean
      isBitEthereum?: boolean
      isBitKeepChrome?: boolean
    }  
  }
  ethereum?: {
    isMetaMask?: true
    request?: (...args: any[]) => void
    isBitKeep?: boolean
    isBitEthereum?: boolean
    isBitKeepChrome?: boolean
  }
}

declare global {
  interface Window {
    hashmail: any;
  }
}
