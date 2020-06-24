interface EnvironmentInterface {
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
  hivePegAccount: string;
  nativeToken: string;
  disabledTokens: string[];
  peggedToken: string;
  features: any;
}

interface State {
  $action: any;
  account: AccountInterface;
  firebaseUser: any;
  loggedIn: boolean;
  loading: boolean;
  tokens: ICoin[];
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

interface BalanceInterface {
    metric: any;
    priceChangeHive: number;
    _id: number;
    account: string;
    balance: string;
    lastPrice: number;
    name: string;
    priceChangePercent: number;
    scotConfig?: any;
    symbol: string;
    usdValue: number;
    usdValueFormatted: string;
    metadata: any;
}
