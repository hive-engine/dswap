export const baseEnvironmentConfiguration: Partial<IEnvironment> = {
    siteName: 'DSwap',
    defaultLocale: 'en',
    GRAPHQL_API: 'https://graphql.steem.services/',
    SCOT_API: 'https://scot-api.steem-engine.com/',
    HISTORY_API: 'https://accounts.hive-engine.com/',
    CONVERTER_API: 'https://converter-api.hive-engine.com/api/',
    FIREBASE_API: 'https://us-central1-tribaldex-d22e0.cloudfunctions.net/api/',
    EXCHANGE_URL: 'https://hive-engine.com/',
    maintenanceMode: false,
    swapEnabledTokens: ['BEE', 'DEC', 'KANDA', 'SAND', 'SWAP.BCH', 'SWAP.BTC', 'SWAP.BTS', 'SWAP.DOGE', 'SWAP.ENG', 'SWAP.EOS', 'SWAP.GOLOS', 'SWAP.HBD', 'SWAP.LTC', 'SWAP.SBD', 'SWAP.STEEM', 'SWAP.SWIFT', 'SWAP.TLOS', 'WEED', 'WORKERBEE'],
    disabledTokens: ['BTC', 'LTC', 'HIVE', 'HBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS', 'LASSE', 'TIME', 'R', 'SCTR', 'ALLAH', 'BNB', 'DONE', 'ETHER', 'LTCPEG', 'SBC', 'BEEHIVE', 'BEECASH'],
    peggedToken: 'SWAP.HIVE',
    marketMakerRegistrationCost: 100,
    marketMakerUpgradeCost: 100,
    marketMakerStakeRequiredPerMarket: 200,
    marketMakerStakeRequiredBasic: 200,
    marketMakerStakeRequiredPremium: 1000,
    marketMakerMaxMarketsBasic: 1,
    marketMakerUpdateMarketCostBasic: 1,
    marketMakerFeeToken: 'BEE',
    isDebug: false,
    debugAccount: '',
    dswapEnabled: false,
    marketMakerEnabled: true,
    features: {
        nfts: {
            enabled: true
        }
    }
};
