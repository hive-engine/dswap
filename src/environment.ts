import { baseEnvironmentConfiguration } from 'base-environment';

export const environment: Partial<IEnvironment> = {
    ...baseEnvironmentConfiguration,
    debug: false,
    testing: false,
    chainId: 'beeab0de00000000000000000000000000000000000000000000000000000000',
    chainId_SE: 'ssc-mainnet1',
    RPC_URL: 'https://api.hive-engine.com/rpc',
    RPC_URL_SE: 'https://api.steem-engine.com/rpc2',
    NODE_API_URL: 'https://node-api.steem-engine.com/v1/',
    ACCOUNTS_API_URL: 'https://api.steem-engine.com/accounts',
    CONVERTER_API_HE: 'https://converter-api.hive-engine.com/api/',
    nativeToken: 'BEE',
    hivePegAccount: 'honey-swap'
};
