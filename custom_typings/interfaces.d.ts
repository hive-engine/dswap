interface IEnvironment {
  debug: boolean;
  testing: boolean;
  FIREBASE_API: string;
  chainId: string;
  siteName: string;
  defaultLocale: string;
  maintenanceMode: boolean;
  RPC_URL: string;
  ACCOUNTS_API_URL: string;
  CONVERTER_API: string;
  NODE_API_URL: string;
  GRAPHQL_API: string;
  HISTORY_API: string;
  SCOT_API: string;
  EXCHANGE_URL: string;
  dswapEnabled: boolean;
  marketMakerEnabled: boolean;
  hivePegAccount: string;
  nativeToken: string;
    swapEnabledTokens: string[];
    disabledTokens: string[];
  peggedToken: string;
    features: any;
    marketMakerRegistrationCost: number;
    marketMakerUpgradeCost: number;
    marketMakerStakeRequiredPerMarket: number;
    marketMakerStakeRequiredBasic: number;
    marketMakerStakeRequiredPremium: number;
    marketMakerMaxMarketsBasic: number;
    marketMakerUpdateMarketCostBasic: number;
    marketMakerFeeToken: string;
}

interface IState {
    $action: any;
    account: AccountInterface;
    marketMakerUser: IMarketMakerUser;
    firebaseUser: any;
    loggedIn: boolean;
    loading: boolean;
    tokens: IToken[];
    tokensLoaded: boolean;
    buyBook: any[];
    sellBook: any[];
    tradeHistory: any[];
    buyTotal?: number;
    sellTotal?: number;
    pendingWithdrawals: any[];
    conversionHistory: any[];
    nft: INft;
    nfts: INft[];
    instances: INftInstance[];
    instance: INftInstance;
    nftSellBook: INftSellBook[];
    hivePriceUsd: string;
    hivePriceUsdDate: string;
}

interface ICoinPair {
    _id: number;
    exchange_rate: string;
    from_coin: string;
    from_coin_symbol: string;
    to_coin: string;
    to_coin_symbol: string;
    __str__: string;
}

interface ICoin {
    symbol: string;
    display_name: string;
    our_account: string;
    can_issue: boolean;
    coin_type: string;
    symbol_id: string;
}

interface IHistoryApiItem {
    _id: string;
    timestamp: number;
    symbol: string;
    volumeSteem: string;
    volumeToken: string;
    lowestPrice: string;
    highestPrice: string;
    openPrice: string;
    closePrice: string;

}

interface ITokenStats {
    symbol: string;
    lastPrice: string;
    lastPriceUsd: string;
    priceChangePercent: string;
    balance: number;
    amount: number;
}

interface ITokenMetadata {
    desc: string;
    icon: string;
    url: string;
}

interface IToken {
    _id: number;
    circulatingSupply: string;    
    maxSupply: string;
    metadata: ITokenMetadata;
    name: string;
    precision: number;    
    supply: string;
    symbol: string;
    usdValue?: number;
    usdValueFormatted?: string;
    metrics?: ITokenMetrics;
    userBalance?: IBalance;
}

interface ITokenMetrics {
    highestBid: number;
    lastPrice: number;
    lastPriceUsd: string;
    lowestAsk: number;
    marketCap: number;    
    priceChangeHive: number;
    priceChangePercent: number;
    symbol: string;
    volume: number;
    volumeExpiration: number;
}

interface IBalance {
    _id: number;
    account: string;
    balance: number; 
    usdValue?: number;
    usdValueFormatted?: string;
    stake: string;
    symbol: string;
}

interface IAccountHistoryItemResult {
    _id: string;
    account: string;
    balance: string;
    blockNumber: number;
    from: string;
    memo: string;
    operation: string;
    quantity: string;    
    quantityHive: string;
    quantityLocked: string;
    quantityReturned: string;
    quantityTokens: string;
    quantityUnlocked: string;
    symbol: string;    
    timestamp: number;
    timestamp_day: string;
    timestamp_month_name: string;
    timestamp_string: string;
    to: string;       
    transactionId: string;   
    type: string; 
    usdValue?: any;
    
}

interface IMarketMakerUser {
    _id: number;
    account: string;
    isPremium: boolean;
    isPremiumFeePaid: boolean;
    isOnCooldown: boolean;
    isEnabled: boolean;
    markets: number;
    enabledMarkets: number;
    timeLimit: number;
    timeLimit_string?: string;
    lastTickTimestamp: number;
    lastTickTimestamp_string?: string;
    lastTickBlock: number;
    creationTimestamp: number;
    creationTimestamp_string?: string;
    creationBlock: number;
}

interface IMarketMakerParams {
    basicFee: number;
    basicSettingsFee: number;
    premiumFee: number;
    premiumBaseStake: number;
    stakePerMarket: number;
    basicDurationBlocks: number;
    basicCooldownBlocks: number;
    basicMinTickIntervalBlocks: number;
    premiumMinTickIntervalBlocks: number;
    basicMaxTicksPerBlock: number;
    premiumMaxTicksPerBlock: number;
}

interface IMarketMakerMarket {
    _id?: number;
    account?: string;
    symbol: string;
    precision?: number;
    strategy?: string;
    maxBidPrice?: number;
    minSellPrice?: number;
    maxBaseToSpend?: number;
    minBaseToSpend?: number;
    maxTokensToSell?: number;
    minTokensToSell?: number;
    priceIncrement?: number;
    maxDistFromNext?: number;
    ignoreOrderQtyLt?: number;
    minSpread?: number;
    isEnabled?: boolean;
    creationTimestamp?: number;
    creationTimestamp_string?: string;
    creationBlock?: string;
    icon?: string;
}
