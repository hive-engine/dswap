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
  steempAccount: string;
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
}
