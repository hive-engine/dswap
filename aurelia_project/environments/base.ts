export const baseEnvironmentConfiguration: Partial<IEnvironment> = {
    siteName: 'DSwap',
    defaultLocale: 'en',
    GRAPHQL_API: 'https://graphql.steem.services/',
    SCOT_API: 'https://scot-api.steem-engine.com/',
    HISTORY_API: 'https://accounts.hive-engine.com/',
    CONVERTER_API: 'https://converter-api.hive-engine.com/api/',
    FIREBASE_API: 'https://us-central1-tribaldex-d22e0.cloudfunctions.net/api/',
    maintenanceMode: false,
    enabledTokens: ['BEE', 'DEC', 'KANDA', 'SAND', 'SWAP.BCH', 'SWAP.BTC', 'SWAP.BTS', 'SWAP.DOGE', 'SWAP.ENG', 'SWAP.EOS', 'SWAP.GOLOS', 'SWAP.HBD', 'SWAP.LTC', 'SWAP.SBD', 'SWAP.STEEM', 'SWAP.SWIFT', 'SWAP.TLOS', 'WEED', 'WORKERBEE'],
    peggedToken: 'SWAP.HIVE',
    marketMakerRegistrationCost: 100,
    features: {
        nfts: {
            enabled: true
        }
    }
};
