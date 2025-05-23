interface IEnvironment {
  debug: boolean;
  testing: boolean;
    FIREBASE_API_HE: string;
    FIREBASE_API_SE: string;
    chainId: string;
    chainId_SE: string;
  siteName: string;
  defaultLocale: string;
  maintenanceMode: boolean;
    RPC_URL: string;
    RPC_URL_SE: string;
  ACCOUNTS_API_URL: string;
    CONVERTER_API_HE: string;
    CONVERTER_API_SE: string;
  NODE_API_URL: string;
  GRAPHQL_API: string;
    HISTORY_API_HE: string;
    HISTORY_API_SE: string;
    SCOT_API_HE: string;
    SCOT_API_SE: string;
    EXCHANGE_URL_HE: string;
    EXCHANGE_URL_SE: string;
    DSWAP_API_URL: string;
    DSWAP_API_VERSION: string;
    DSWAP_ACCOUNT_HE: string;
    DSWAP_SOURCE_ID: string;
    BLOCK_EXPLORER_HE: string;
    BLOCK_EXPLORER_SE: string;
    TRIBALDEX_API_URL: string;
    dswapEnabled: boolean;
    dswapPaused: boolean;
    marketMakerEnabled: boolean;
  hivePegAccount: string;
  nativeToken: string;
    swapEnabledTokens: string[];
    swapEnabledCrypto: string[];
    disabledTokens: string[];
    disabledTokens_SE: string[];
    settings: any;
    peggedToken: string;
    peggedToken_SE: string;
    features: any;
    marketMakerRegistrationCost: number;
    marketMakerUpgradeCost: number;
    marketMakerStakeRequiredPerMarket: number;
    marketMakerStakeRequiredBasic: number;
    marketMakerStakeRequiredPremium: number;
    marketMakerMaxMarketsBasic: number;
    marketMakerUpdateMarketCostBasic: number;
    marketMakerFeeToken: string;
    marketMakerFeeToken_SE: string;
    isDebug: boolean;
    debugAccount: string;
    dswapDcaFee: number;
    dswapDcaCancelFee: number;
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
    activePageId: string;
    dswapChainId: number;
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
    isCrypto: boolean;
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
    timestamp_year: string;
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
    placeAtBidWall?: number;
    placeAtSellWall?: number;
}

interface IMarketMakerOrderStrategy {
    _id: number;
    name: string;
    description?: string;
}

interface IDSwapChain {
    id: number;
    name: string;
    name_short: string;
}

interface AccountInterface {
    name: string;
    account: any;
    balances: any[];
    scotTokens: any[];
    pendingUnstakes: any[];
    token: any;
    notifications: any[];
    nfts: INft[];
    dswapChainId: number;
}

interface ISwapRequestModel {
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    TokenOutputAmount: number;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    MaxSlippageInputToken: number;
    MaxSlippageOutputToken: number;
    BaseTokenAmount: number;   
    TokenInputMemo: string;
}

interface ISwapRequestResponseModel {
    Id: string;
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    TokenOutputAmount: number;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    MaxSlippageInputToken: number;
    MaxSlippageOutputToken: number;
    BaseTokenAmount: number;
    TokenInputMemo: string;
}

interface ISwapRequestViewModel {
    Id: string;
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    TokenOutputAmount: number;
    TokenOutputAmountActual: number;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    timestamp_month_name: string;
    timestamp_day: string;
    timestamp_time: string;
    timestamp_year: string;
    CreatedAt: string;
    SwapStatusId: number;
    SwapStatusName: string;
}

interface ISwapRequestTransactionViewModel {
    Id: string;
    Account: string;
    SwapRequestId: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    TokenOutputAmount: number;
    ChainTransactionId: string;
    timestamp_month_name: string;
    timestamp_day: string;
    timestamp_time: string;
    timestamp_year: string;
    CreatedAt: string;
    SwapStepId: number;
    SwapStatusId: number;
    SwapStatusName: string;
    SwapStepName: string;
}

interface ISwapCalcValuesModel {
    TokenInput?: string;
    TokenInputAmount?: number;
    TokenOutput?: string;
    TokenOutputAmount?: number;
    Chain?: number;
    BaseTokenAmount?: number;
}

/* DCA */
interface ISwapRequestDCAModel {
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    TokenInputMemo: string;    
    RecurrenceTypeAmount: number,
    RecurrenceType: string,
    OrderCount: number
}

interface ISwapRequestDCAResponseModel {
    Id: string;
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    TokenInputMemo: string;    
    RecurrenceTypeAmount: number,
    RecurrenceType: string,
    OrderCount: number
}

interface ISwapRequestDCAViewModel {
    Id: string;
    Account: string;
    TokenInput: string;
    TokenInputAmount: number;
    TokenOutput: string;
    TokenOutputAmount: number;
    TokenOutputAmountActual: number;
    Chain: number;
    ChainTransactionId: string;
    SwapSourceId: string;
    timestamp_month_name: string;
    timestamp_day: string;
    timestamp_time: string;
    timestamp_year: string;
    CreatedAt: string;
    SwapStatusId: number;
    SwapStatusName: string;
    RecurrenceTypeAmount: number,
    RecurrenceType: string,
    OrderCount: number
    TokenInputMemo: string;
    CancelRequested: boolean;
}

interface ISwapRequestDCADetailViewModel {
    SwapRequestDCA: ISwapRequestDCAViewModel;
    SwapRequests: ISwapRequestViewModel[];
    DCARefunds: ISwapRequestTransactionViewModel[];
}

interface IDCACancelRequestModel {
    Account: string;
    Chain: number;
    ChainTransactionId: string;
    DCAId: string;
    SourceId: string; 
    TokenInputMemo: string;
    Message: string;
}

interface IDCACancelViewModel {
    Id: string;
    Account: string;
    Chain: number;
    ChainTransactionId: string;
    CreatedAt: string;
    DCAId: string;
    Message: string;
    SourceId: string; 
    StatusId: number;
    StatusName: string;
    timestamp_month_name: string;
    timestamp_day: string;
    timestamp_time: string;
    timestamp_year: string;
    TokenInputMemo: string;
}
