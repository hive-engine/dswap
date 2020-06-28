/* eslint-disable @typescript-eslint/no-use-before-define */
import { usdFormat, getPrices } from 'common/functions';
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

export async function loadUserBalances(account: string, limit = 1000, offset = 0) {
    const prices: any = await getPrices();
    const results: any[] = await ssc.find('tokens', 'balances', { account }, limit, offset, '', false);

    const symbols = [];

    for (const symbol of results) {
        symbols.push(symbol.symbol);
    }

    const tokens = await ssc.find('tokens', 'tokens', { symbol: { $in: symbols } }, 1000, 0);
    const metrics = await ssc.find('market', 'metrics', { symbol: { $in: symbols } }, 1000, 0, '', false);

    for (const token of results) {
        if (token?.balance) {
            token.balance = parseFloat(token.balance);
        }

        if (token?.delegationsIn) {
            token.delegationsIn = parseFloat(token.delegationsIn);
        }

        if (token?.delegationsOut) {
            token.delegationsOut = parseFloat(token.delegationsOut);
        }

        if (token?.stake) {
            token.stake = parseFloat(token.stake);
        }

        if (token?.pendingUnstake) {
            token.pendingUnstake = parseFloat(token.pendingUnstake);
        }

        const findToken = tokens.find(t => t.symbol === token.symbol);
        const metric = metrics.find(m => m.symbol === token.symbol);

        token.token = findToken;

        if (token.token) {
            token.token.metadata = JSON.parse(token.token.metadata);
        }

        if (metric) {
            token.highestBid = parseFloat(metric.highestBid);
            token.lastPrice = parseFloat(metric.lastPrice);
            token.lowestAsk = parseFloat(metric.lowestAsk);
            token.marketCap = token.lastPrice * token.circulatingSupply;

            if (Date.now() / 1000 < metric.volumeExpiration) {
                token.volume = parseFloat(metric.volume);
            }

            if (Date.now() / 1000 < metric.lastDayPriceExpiration) {
                token.priceChangePercent = parseFloat(metric.priceChangePercent);
                token.priceChangeHive = parseFloat(metric.priceChangeHive);
            }
        }
        
        token.highestBid = parseFloat(token.highestBid);
        token.lastPrice = parseFloat(token.lastPrice);
        token.lowestAsk = parseFloat(token.lowestAsk);
        token.marketCap = token.lastPrice * parseFloat(token.circulatingSupply);
        token.lastDayPrice = parseFloat(token.lastDayPrice);

        if (token?.lastPrice) {
            token.usdValueFormatted = usdFormat(parseFloat(token.balance) * token.lastPrice, 3, prices.steem_price);
            token.usdValue = usdFormat(parseFloat(token.balance) * token.lastPrice, 3, prices.steem_price, true);
        } else {
            token.usdValueFormatted = usdFormat(parseFloat(token.balance) * 1, 3, prices.steem_price);
            token.usdValue = usdFormat(parseFloat(token.balance) * 1, 3, prices.steem_price, true);
        }
    }

    const scotConfig = await getScotConfigForAccount(account);

    if (results && Object.keys(scotConfig).length) {
        for (const token of results) {
            const scotConfigToken = scotConfig[token.symbol];

            if (scotConfigToken) {
                token.scotConfig = scotConfigToken;
            }
        }
    }

    if (results.length) {
        const balances = results.filter(b => !environment.disabledTokens.includes(b.symbol));

        balances.sort(
            (a, b) =>
                parseFloat(b.balance) * b?.lastPrice ??
                0 * window.hive_price - parseFloat(b.balance) * a?.lastPrice ??
                0 * window.hive_price,
        );

        return balances;
    } else {
        return [];
    }
}

export async function loadTokens(symbols = [], limit = 50, offset = 0): Promise<any[]> {
    const queryConfig: any = {};

    if (symbols.length) {
        queryConfig.symbol = { $in: symbols };
    }

    const results = [];

    const metrics = await ssc.find('market', 'metrics', queryConfig);
    metrics.sort((a, b) => {
        return (
            parseFloat(b.volume) - parseFloat(a.volume)
        );
    });

    const limitedMetrics = metrics.slice(offset, limit);

    queryConfig.symbol = {
        $in: limitedMetrics.map(m => m.symbol)
    }

    const tokens: any[] = await ssc.find('tokens', 'tokens', queryConfig, limit, offset, [{ index: 'symbol', descending: false }]);

    for (const token of tokens) {
        if (environment.disabledTokens.includes(token.symbol)) {
            continue;
        }

        if (token?.metadata) {
            token.metadata = JSON.parse(token.metadata);
        }

        token.highestBid = 0;
        token.lastPrice = 0;
        token.lowestAsk = 0;
        token.marketCap = 0;
        token.volume = 0;
        token.priceChangePercent = 0;
        token.priceChangeHive = 0;

        const metric = limitedMetrics.find(m => token.symbol == m.symbol);

        if (!metric) {
            return;
        }

        if (metric) {
            token.highestBid = parseFloat(metric.highestBid);
            token.lastPrice = parseFloat(metric.lastPrice);
            token.lowestAsk = parseFloat(metric.lowestAsk);
            token.marketCap = token.lastPrice * token.circulatingSupply;

            if (Date.now() / 1000 < metric.volumeExpiration) {
                token.volume = parseFloat(metric.volume);
            }

            if (Date.now() / 1000 < metric.lastDayPriceExpiration) {
                token.priceChangePercent = parseFloat(metric.priceChangePercent);
                token.priceChangeHive = parseFloat(metric.priceChangeHive);
            }
        }

        if (token.symbol === 'SWAP.HIVE') {
            token.lastPrice = 1;
        }

        results.push(token);
    }

    results.sort((a, b) => {
        return (b.volume > 0 ? b.volume : b.marketCap / 1000000000000) - (a.volume > 0 ? a.volume : a.marketCap / 1000000000000);
    });

    const hivepBalance = await loadHivepBalance();

    const finalTokens = results.filter(t => !environment.disabledTokens.includes(t.symbol));

    if (hivepBalance && hivepBalance.balance) {
        const token = finalTokens.find(t => t.symbol === 'SWAP.HIVE');

        if (token) {
            token.supply -= parseFloat(hivepBalance.balance);
            (token as any).circulatingSupply -= parseFloat(hivepBalance.balance);
        }
    }

    return finalTokens;
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
        const result = await http.fetch(`${environment.SCOT_API}@${account}`);

        return result.json();
    } catch (e) {
        return null;
    }
}
