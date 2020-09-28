/* eslint-disable @typescript-eslint/no-use-before-define */
import { usdFormat, getPrices } from 'common/functions';
/* eslint-disable no-undef */
import { HttpClient } from 'aurelia-fetch-client';
import { queryParam } from 'common/functions';
import { environment } from 'environment';
import { ssc } from './ssc';
import { sscse } from './ssc-se';
import { mapTokenResultToIToken, mapBalanceResultToIBalance, mapMetricsResultToTokenMetrics } from './mappers';
import moment from 'moment';
import { Chain } from './enums';

const http = new HttpClient();

export async function request(url: string, params: any = {}) {
    // Cache buster
    params.v = new Date().getTime();

    url = url + queryParam(params);

    return http.fetch(url, {
        method: 'GET',
    });
}

const delay = t => new Promise(resolve => setTimeout(resolve, t));

export async function loadMarkets(symbols = [], limit = 1000, offset = 0): Promise<IMarketMakerMarket[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    let markets : IMarketMakerMarket[] = [];
    const results = await ssc.find('botcontroller', 'markets', queryConfig);
    
    for (const res of results) {
        markets.push(<IMarketMakerMarket>res);
    }

    return markets;
}

export async function loadMarketsByUser(account: any, symbols = [], chain: Chain): Promise<IMarketMakerMarket[]> {    
    const queryConfig: any = {};

    if (account) {
        queryConfig.account = account;
    } else {
        return null;
    }

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    let markets: IMarketMakerMarket[] = [];
    let results: any;
    if (chain == Chain.Hive) {
        results = await ssc.find('botcontroller', 'markets', queryConfig);
    } else if (chain == Chain.Steem) {
        results = await sscse.find('botcontroller', 'markets', queryConfig);
    }

    if (results) {
        for (const res of results) {
            let arr = <IMarketMakerMarket>res;
            arr.creationTimestamp_string = moment.unix(arr.creationTimestamp / 1000).format('YYYY-MM-DD HH:mm:ss');
            markets.push(res);
        }
    }

    return markets;
}

export async function getUser(account: string, chain: Chain): Promise<IMarketMakerUser> {
    const queryConfig: any = { account: account };

    let user: IMarketMakerUser = {
        account: "",
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
    };

    let results: any;
    if (chain == Chain.Hive) {
        results = await ssc.find('botcontroller', 'users', queryConfig);
    } else if (chain == Chain.Steem) {
        results = await sscse.find('botcontroller', 'users', queryConfig);
    }
    if (results) {
        user = <IMarketMakerUser>results[0];
    }

    return user;
}
