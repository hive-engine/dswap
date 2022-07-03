export const baseEnvironmentConfiguration: Partial<IEnvironment> = {
    siteName: 'DSwap',
    defaultLocale: 'en',
    SCOT_API_HE: 'https://scot-api.steem-engine.net/',
    SCOT_API_SE: 'https://scot-api.steem-engine.net/',
    HISTORY_API_HE: 'https://history.hive-engine.com/',
    HISTORY_API_SE: 'https://api.steem-engine.net/history/',
    CONVERTER_API_HE: 'https://converter-api.hive-engine.com/api/',
    CONVERTER_API_SE: 'https://converter-api.steem-engine.net/api/',
    FIREBASE_API_HE: 'https://us-central1-tribaldex-d22e0.cloudfunctions.net/api/',
    FIREBASE_API_SE: 'https://us-central1-steem-engine-dex.cloudfunctions.net/api/',
    EXCHANGE_URL_HE: 'https://hive-engine.com/',
    EXCHANGE_URL_SE: 'https://steem-engine.net/',
    /*DSWAP_API_URL: 'http://localhost:37322/api/',*/
    DSWAP_API_URL: 'https://dswap-api.dswap.trade/api/',
    /*DSWAP_API_URL: 'https://dswap.azurewebsites.net/api/',*/
    BLOCK_EXPLORER_HE: 'https://he.dtools.dev/',
    BLOCK_EXPLORER_SE: 'https://se.dtools.dev/',
    DSWAP_API_VERSION: '2.0',
    DSWAP_ACCOUNT_HE: 'dswap',
    DSWAP_SOURCE_ID: '5fab0821cdef24759c5ae9a9',
    maintenanceMode: false,
    swapEnabledTokens: ['BEE', 'DEC', 'KANDA', 'SAND', 'SWAP.BCH', 'SWAP.BTC', 'SWAP.BTS', 'SWAP.DOGE', 'SWAP.ENG', 'SWAP.EOS', 'SWAP.GOLOS', 'SWAP.HBD', 'SWAP.LTC', 'SWAP.SBD', 'SWAP.STEEM', 'SWAP.SWIFT', 'SWAP.TLOS', 'WEED', 'WORKERBEE', 'PAL', 'LEO', 'SWAP.HIVE', 'PLOT'],
    swapEnabledCrypto: ['STEEM', 'SBD', 'HBD', 'EOS', 'BTS', 'BTC', 'LTC', 'SWIFT', 'BCH', 'DOGE'],
    disabledTokens: ['BTC', 'LTC', 'STEEM', 'SBD', 'HIVE', 'HBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS', 'DONE', 'BNB', 'LASSE', 'R', 'SCTR', 'ALLAH', 'ETHER', 'LTCPEG', 'SBC', 'TEST.EON', 'BEEHIVE', 'BEECASH', 'SPL.FUND', 'ATOM.TOKEN', 'DSWAP', 'LEOG', 'PAK', 'APXM', 'LBIM', 'BROAG', 'COIN.HONEY', 'CUB', 'ENJ', 'GUILD', 'RAFFLE', 'CUNT', 'FQX', 'FOX', 'MOOBEE', 'BUILD'],
    disabledTokens_SE: ['BTC', 'LTC', 'STEEM', 'SBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS', 'LASSE', 'TIME', 'R', 'SCTR', 'ALLAH', 'DONE', 'BNB', 'ETHER', 'LTCPEG', 'SBC', 'LASSECASH', 'HIVE', 'TIX', 'TIXM', 'STEM', 'STEMM', 'LEO', 'LEOM', 'LEOMM', 'NEO', 'NEOX', 'PORN', 'SPORTS', 'BATTLE', 'SIM', 'CTP', 'CTPM', 'EMFOUR', 'CCC', 'CCCM', 'BEER', 'WEED', 'WEEDM', 'WEEDMM', 'SPACO', 'SPACOM', 'NEOXAG', 'NEOXAGM', 'KANDA', 'SAND', 'INFOWARS', 'SPI', 'PAL', 'PALM', 'PALMM', 'ENGAGE', 'BRO', 'CC', 'BUILDTEAM', 'ECO', 'GAMER', 'EPC', 'SPT', 'JAHM'],
    peggedToken: 'SWAP.HIVE',
    peggedToken_SE: 'STEEMP',
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
    dswapEnabled: true,
    marketMakerEnabled: true,
    dswapPaused: false,
    features: {
        nfts: {
            enabled: true
        }
    }
};
