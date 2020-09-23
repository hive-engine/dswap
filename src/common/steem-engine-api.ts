/* eslint-disable @typescript-eslint/no-use-before-define */
import { usdFormat, getPrices } from 'common/functions';
/* eslint-disable no-undef */
import { HttpClient } from 'aurelia-fetch-client';
import { queryParam } from 'common/functions';
import { environment } from 'environment';
import { sscse } from './ssc-se';
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
        sscse.getTransactionInfo(trxId, async (err, result) => {
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

export async function checkTransactionSE(trxId: string, retries: number) {
    try {
        return await getTransactionInfo(trxId);
    } catch (e) {
        if (retries > 0) {
            await delay(5000);

            try {
                return await checkTransactionSE(trxId, retries - 1);
            } catch (e) {
                return await checkTransactionSE(trxId, retries - 1);
            }
        } else {
            throw new Error('Transaction not found.');
        }
    }
}

export async function loadCoinsSE(): Promise<ICoin[]> {
    const url = `${environment.CONVERTER_API_SE}coins/`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ICoin[]>;
}

export async function loadCoinPairsSE(): Promise<ICoinPair[]> {
    const url = `${environment.CONVERTER_API_SE}pairs/`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ICoinPair[]>;
}

export async function loadTokenMetricsSE(symbols = [], limit = 1000, offset = 0): Promise<any[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    let metrics = [];
    const results = await sscse.find('market', 'metrics', queryConfig);        
    
    for (const res of results) {
        metrics.push(mapMetricsResultToTokenMetrics(res));
    }

    return metrics;
}

export async function loadTokenMarketHistorySE(symbol: string, timestampStart?: string, timestampEnd?: string): Promise<IHistoryApiItem[]> {
    let url = `${environment.HISTORY_API_SE}marketHistory?symbol=${symbol.toUpperCase()}`;

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

export async function loadUserBalancesSE(account: string, symbols = [], limit = 1000, offset = 0) : Promise<IBalance[]> {
    const queryConfig: any = {};
    queryConfig.symbol = { $in: symbols };
    queryConfig.account = account;

    const results: any[] = await sscse.find('tokens', 'balances', queryConfig, limit, offset, '', false);    
    let balances: IBalance[] = [];
    for (const res of results) {
        balances.push(mapBalanceResultToIBalance(res));
    }

    return balances;
}

export async function loadTokensSE(symbols = [], limit = 50, offset = 0): Promise<IToken[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    const results: any[] = await sscse.find('tokens', 'tokens', queryConfig, limit, offset, [{ index: 'symbol', descending: false }]);
    let tokens: IToken[] = [];

    for (const res of results) {
        tokens.push(mapTokenResultToIToken(res));
    }

    return tokens;
}

export async function getScotConfigForAccountSE(account: string) {
    try {
        const result = await http.fetch(`${environment.SCOT_API_SE}@${account}`);

        return result.json();
    } catch (e) {
        return null;
    }
}

export async function loadAccountHistorySE(account: string, symbol?: string, timestampStart?: string, timestampEnd?: string, limit?: number, offset?: number): Promise<IAccountHistoryItemResult[]> {
    let url = `${environment.HISTORY_API_SE}accountHistory?account=${account}`;

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
