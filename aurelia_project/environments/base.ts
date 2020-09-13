export const baseEnvironmentConfiguration: Partial<IEnvironment> = {
    siteName: 'DSwap',
    defaultLocale: 'en',
    SCOT_API_HE: 'https://scot-api.steem-engine.com/',
    SCOT_API_SE: 'https://scot-api.steem-engine.com/',
    HISTORY_API_HE: 'https://accounts.hive-engine.com/',
    HISTORY_API_SE: 'https://api.steem-engine.com/history/',
    CONVERTER_API_HE: 'https://converter-api.hive-engine.com/api/',
    CONVERTER_API_SE: 'https://converter-api.steem-engine.com/api/',
    FIREBASE_API_HE: 'https://us-central1-tribaldex-d22e0.cloudfunctions.net/api/',
    FIREBASE_API_SE: 'https://us-central1-steem-engine-dex.cloudfunctions.net/api/',
    EXCHANGE_URL_HE: 'https://hive-engine.com/',
    EXCHANGE_URL_SE: 'https://steem-engine.com/',
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
    marketMakerFeeToken_SE: 'ENG',
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
