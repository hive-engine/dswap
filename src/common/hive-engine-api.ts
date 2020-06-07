/* eslint-disable @typescript-eslint/no-use-before-define */
import { usdFormat } from 'common/functions';
/* eslint-disable no-undef */
import { HttpClient } from 'aurelia-fetch-client';
import { queryParam } from 'common/functions';
import { environment } from 'environment';
import { ssc } from './ssc';

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
    const url = `${environment.CONVERTER_API}/coins/`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ICoin[]>;
}

export async function loadCoinPairs(): Promise<ICoinPair[]> {
    const url = `${environment.CONVERTER_API}/pairs/`;

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

    const results = [];
    const metrics = await ssc.find('market', 'metrics', queryConfig);        

    return metrics;
}

export async function loadTokenMarketHistory(symbol: string, timestampStart?: string, timestampEnd?: string): Promise<IHistoryApiItem[]> {
    let url = `${environment.HISTORY_API}marketHistory?symbol=${symbol.toUpperCase()}`;

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
