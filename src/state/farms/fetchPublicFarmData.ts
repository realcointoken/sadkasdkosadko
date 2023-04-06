import BigNumber from 'bignumber.js'
import masterchefABI from 'config/abi/masterchef.json'
import erc20 from 'config/abi/erc20.json'
import routerAbi from 'config/abi/router.json'
import { getAddress, getMasterChefAddress, getRouterAddress } from 'utils/addressHelpers'
import { getRouterContract } from 'utils/contractHelpers'
import { BIG_TEN, BIG_ZERO } from 'utils/bigNumber'
import getTokenUSDPrice from 'utils/getTokenUSDPrice'
import multicall from 'utils/multicall'
import tokens from 'config/constants/tokens';
import { Farm, SerializedBigNumber } from '../types'

type PublicFarmData = {
  tokenAmountMc: SerializedBigNumber
  quoteTokenAmountMc: SerializedBigNumber
  tokenAmountTotal: SerializedBigNumber
  quoteTokenAmountTotal: SerializedBigNumber
  lpTotalInQuoteToken: SerializedBigNumber
  farmTokenTotal: SerializedBigNumber
  lpTokenPriceUsd: SerializedBigNumber
  lpTotalSupply: SerializedBigNumber
  tokenPriceVsQuote: SerializedBigNumber
  poolWeight: SerializedBigNumber
  multiplier: string
}


const fetchFarm = async (farm: Farm): Promise<PublicFarmData> => {
  try {
    
  
  const { pid, lpAddresses, token, quoteToken } = farm
  
  const lpAddress = getAddress(lpAddresses)
  const calls = [
    // Balance of token in the LP contract
    {
      address: getAddress(token.address),
      name: 'balanceOf',
      params: [lpAddress],
    },
    // Balance of quote token on LP contract
    {
      address: getAddress(quoteToken.address),
      name: 'balanceOf',
      params: [lpAddress],
    },
    // Balance of LP tokens in the master chef contract
    {
      address: lpAddress,
      name: 'balanceOf',
      params: [getMasterChefAddress()],
    },
    // Total supply of LP tokens
    {
      address: lpAddress,
      name: 'totalSupply',
    },
    // Token decimals
    {
      address: getAddress(token.address),
      name: 'decimals',
    },
    // Quote token decimals
    {
      address: getAddress(quoteToken.address),
      name: 'decimals',
    },
  ]

  const [tokenBalanceLP, quoteTokenBalanceLP, lpTokenBalanceMC, lpTotalSupply, tokenDecimals, quoteTokenDecimals] =
    await multicall(erc20, calls)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new BigNumber(lpTokenBalanceMC).div(new BigNumber(lpTotalSupply))
  const farmTokenTotal = new BigNumber(lpTokenBalanceMC).div(BIG_TEN.pow(new BigNumber(farm.lpDecimals)))

  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = new BigNumber(tokenBalanceLP).div(BIG_TEN.pow(tokenDecimals))
  const quoteTokenAmountTotal = new BigNumber(quoteTokenBalanceLP).div(BIG_TEN.pow(quoteTokenDecimals))

  // Amount of token in the LP that are staked in the MC (i.e amount of token * lp ratio)
  const tokenAmountMc = tokenAmountTotal.times(lpTokenRatio)
  const quoteTokenAmountMc = quoteTokenAmountTotal.times(lpTokenRatio)

  // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMc.times(new BigNumber(2))

  // For farms that tokens instead of LP tokens. Get token price in Brise via the Router
  let lpTokenPriceInBrise = new BigNumber(0)
  let brisePriceUsd = new BigNumber(0)
  if(!farm.isLpToken){
    // wbnb === wbrise
    // 100 $Brise USD price
    brisePriceUsd = await getTokenUSDPrice(tokens.wbnb.address, 100, tokens.wbnb.decimals, tokens.usdt.address, tokens.usdt.decimals)
    
    lpTokenPriceInBrise = await getTokenUSDPrice(lpAddresses, 1, farm.lpDecimals, tokens.wbnb.address, tokens.wbnb.decimals)
  }
  const lpTokenPriceUsd = lpTokenPriceInBrise.times(brisePriceUsd).div(100)

  
  // Only make masterchef calls if farm has pid
  const [info, totalAllocPoint] =
    pid || pid === 0
      ? await multicall(masterchefABI, [
          {
            address: getMasterChefAddress(),
            name: 'poolInfo',
            params: [pid],
          },
          {
            address: getMasterChefAddress(),
            name: 'totalAllocPoint',
          },
        ])
      : [null, null]

      const allocPoint = info ? new BigNumber(info.allocPoint?._hex) : BIG_ZERO
      const poolWeight = totalAllocPoint ? allocPoint.div(new BigNumber(totalAllocPoint)) : BIG_ZERO
  return {
    tokenAmountMc: tokenAmountMc.toJSON(),
    quoteTokenAmountMc: quoteTokenAmountMc.toJSON(),
    tokenAmountTotal: tokenAmountTotal.toJSON(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toJSON(),
    farmTokenTotal: new BigNumber(farmTokenTotal).toJSON(),
    lpTokenPriceUsd: lpTokenPriceUsd.toJSON(),
    lpTotalSupply: new BigNumber(lpTotalSupply).toJSON(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toJSON(),
    tokenPriceVsQuote: quoteTokenAmountTotal.div(tokenAmountTotal).toJSON(),
    poolWeight: poolWeight.toJSON(),
    multiplier: `${allocPoint.div(100).toString()}X`,
  }

} catch (error) {
    return {
      tokenAmountMc: "0",
      quoteTokenAmountMc: "0",
      tokenAmountTotal: "0",
      quoteTokenAmountTotal: "0",
      farmTokenTotal: "0",
      lpTokenPriceUsd: "0",
      lpTotalSupply: "0",
      lpTotalInQuoteToken: "0",
      tokenPriceVsQuote: "0",
      poolWeight: "0",
      multiplier: "0",
    }
}
}

export default fetchFarm
