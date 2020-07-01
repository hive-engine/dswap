import { baseEnvironmentConfiguration } from 'base-environment';

export const environment: Partial<IEnvironment> = {
    ...baseEnvironmentConfiguration,
    debug: false,
    testing: false,
    chainId: 'ssc-mainnet-hive',
    RPC_URL: 'https://api.hive-engine.com/rpc',
    NODE_API_URL: 'https://node-api.steem-engine.com/v1/',
    ACCOUNTS_API_URL: 'https://api.steem-engine.com/accounts',
    CONVERTER_API: 'https://converter-api.hive-engine.com/api/',
    nativeToken: 'BEE',
    hivePegAccount: 'honey-swap'
};
