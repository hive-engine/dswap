export const baseEnvironmentConfiguration: Partial<EnvironmentInterface> = {
    siteName: 'DSwap',
    defaultLocale: 'en',
    GRAPHQL_API: 'https://graphql.steem.services/',
    SCOT_API: 'https://scot-api.steem-engine.com/',
    HISTORY_API: 'https://accounts.hive-engine.com/',
    CONVERTER_API: 'https://converter-api.hive-engine.com/api',
    FIREBASE_API: 'https://us-central1-tribaldex-d22e0.cloudfunctions.net/api/',
    maintenanceMode: false,
    disabledTokens: ['BTC', 'LTC', 'HIVE', 'HBD', 'BCC', 'XAP', 'XRP', 'GOLOS', 'DISNEY', 'AMAZON', 'VOICE', 'ETH', 'EOS', 'LASSE', 'TIME', 'R', 'SCTR', 'ALLAH', 'BNB', 'DONE', 'ETHER', 'LTCPEG', 'SBC'],
    peggedToken: 'SWAP.HIVE',
    features: {
        nfts: {
            enabled: true
        }
    }
};
