import { DefaultChainId } from "common/constants";

export const initialState: IState = {
  $action: {
      name: '',
      params: {}
  },
  account: {
      name: '',
      token: {},
      account: {},
      balances: [],
      scotTokens: [],
      pendingUnstakes: [],
      notifications: [],
      nfts: [],
      dswapChainId: 0
  },
    firebaseUser: {},
    marketMakerUser: {
        account: '',
        creationBlock: 0,
        creationTimestamp: 0,
        enabledMarkets: 0,
        isEnabled: false,
        isOnCooldown: false,
        isPremium: false,
        isPremiumFeePaid: false,
        lastTickBlock: 0,
        lastTickTimestamp: 0,
        markets: 0,
        timeLimit: 0,
        _id: 0
    },
  loggedIn: false,
  loading: false,
  tokens: [],
  pools: [],
  buyBook: [],
  sellBook: [],
  tradeHistory: [],
  conversionHistory: [],
  buyTotal: 0,
  sellTotal: 0,
  pendingWithdrawals: [],
  nft: null,
  nfts: [],
  instance: null,
  instances: [],
  nftSellBook: [],
  tokensLoaded: false,
  hivePriceUsd: '',
    hivePriceUsdDate: null,
    activePageId: 'home',
    dswapChainId: DefaultChainId
};
