/* eslint-disable @typescript-eslint/no-use-before-define */
import { usdFormat, getPrices } from 'common/functions';
/* eslint-disable no-undef */
import { HttpClient } from 'aurelia-fetch-client';
import { queryParam } from 'common/functions';
import { environment } from 'environment';
import { ssc } from './ssc';
import { mapTokenResultToIToken, mapBalanceResultToIBalance, mapMetricsResultToTokenMetrics } from './mappers';

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

export const getTransactionInfo = (trxId: string) =>
    new Promise((resolve, reject) => {
        ssc.getTransactionInfo(trxId, async (err, result) => {
            if (result) {
                if (result.logs) {
                    const logs = JSON.parse(result.logs);

                    if (logs.errors && logs.errors.length > 0) {
                        resolve({
                            ...result,
                            errors: logs.errors,
                            error: logs.errors[0],
                        });
                    }
                }

                resolve(result);
            } else {
                reject(err);
            }
        });
    });

export async function checkTransaction(trxId: string, retries: number) {
    try {
        return await getTransactionInfo(trxId);
    } catch (e) {
        if (retries > 0) {
            await delay(5000);

            try {
                return await checkTransaction(trxId, retries - 1);
            } catch (e) {
                return await checkTransaction(trxId, retries - 1);
            }
        } else {
            throw new Error('Transaction not found.');
        }
    }
}

export async function loadCoins(): Promise<ICoin[]> {
    const url = `${environment.CONVERTER_API_HE}coins/`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ICoin[]>;
}

export async function loadCoinPairs(): Promise<ICoinPair[]> {
    const url = `${environment.CONVERTER_API_HE}pairs/`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ICoinPair[]>;
}

export async function loadTokenMetrics(symbols = [], limit = 1000, offset = 0): Promise<any[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    let metrics = [];
    const results = await ssc.find('market', 'metrics', queryConfig);        
    
    for (const res of results) {
        metrics.push(mapMetricsResultToTokenMetrics(res));
    }

    return metrics;
}

export async function loadTokenMarketHistory(symbol: string, timestampStart?: string, timestampEnd?: string): Promise<IHistoryApiItem[]> {
    let url = `${environment.HISTORY_API_HE}marketHistory?symbol=${symbol.toUpperCase()}`;

    if (timestampStart) {
        url += `&timestampStart=${timestampStart}`;
    }

    if (timestampEnd) {
        url += `&timestampEnd=${timestampEnd}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<IHistoryApiItem[]>;
}

export async function loadUserBalances(account: string, symbols = [], limit = 1000, offset = 0) : Promise<IBalance[]> {
    const queryConfig: any = {};
    queryConfig.symbol = { $in: symbols };
    queryConfig.account = account;

    const results: any[] = await ssc.find('tokens', 'balances', queryConfig, limit, offset, '', false);    
    let balances: IBalance[] = [];    
    for (const res of results) {
        balances.push(mapBalanceResultToIBalance(res));
    }

    return balances;
}

export async function loadTokens(symbols = [], limit = 50, offset = 0): Promise<IToken[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    let results: any[] = await ssc.find('tokens', 'tokens', queryConfig, limit, offset, [{ index: 'symbol', descending: false }]);
    let tokens: IToken[] = [];

    if (results) {
        results = results.filter(t => !environment.disabledTokens.includes(t.symbol));

        for (const res of results) {
            tokens.push(mapTokenResultToIToken(res));
        }
    }

    return tokens;
}

export async function loadHivepBalance() {
    try {
        const result: any = await ssc.findOne('tokens', 'balances', { account: 'honey-swap', symbol: 'SWAP.HIVE' });

        return result;
    } catch (e) {
        return null;
    }
}

export async function getScotConfigForAccount(account: string) {
    try {
        const result = await http.fetch(`${environment.SCOT_API_HE}@${account}`);

        return result.json();
    } catch (e) {
        return null;
    }
}

export async function loadAccountHistory(account: string, symbol?: string, timestampStart?: string, timestampEnd?: string, limit?: number, offset?: number): Promise<IAccountHistoryItemResult[]> {
    let url = `${environment.HISTORY_API_HE}accountHistory?account=${account}`;

    if (symbol) {
        url += `&symbol=${symbol.toUpperCase()}`;
    }

    if (timestampStart) {
        url += `&timestampStart=${timestampStart}`;
    }

    if (timestampEnd) {
        url += `&timestampEnd=${timestampEnd}`;
    }

    if (limit) {
        url += `&limit=${limit}`;
    }

    if (offset) {
        url += `&offset=${offset}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<IAccountHistoryItemResult[]>;
}

export async function loadBuyBook(symbol, limit = 10, offset = 0) {
    return ssc.find('market', 'buyBook', { symbol: symbol }, limit, offset, [{ index: 'priceDec', descending: true }], false);
}

export async function loadSellBook(symbol, limit = 10, offset = 0) {
    return ssc.find('market', 'sellBook', { symbol: symbol }, limit, offset, [{ index: 'priceDec', descending: false }], false);
}
