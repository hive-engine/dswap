export function mapTokenResultToIToken(token) {    
    let mapped : IToken = {
        _id: token._id,
        circulatingSupply: token.circulatingSupply,        
        maxSupply: token.maxSupply,
        metadata: null,
        name: token.name,
        precision: token.precision,        
        supply: token.supply,
        symbol: token.symbol       
    }

    return mapped;
}

export function mapMetricsResultToTokenMetrics(metrics) {
    let mapped: ITokenMetrics = {
        highestBid: parseFloat(metrics.highestBid),
        lastPrice: parseFloat(metrics.lastPrice),
        lastPriceUsd: metrics.lastPrice,
        lowestAsk: parseFloat(metrics.lowestAsk),
        marketCap: 0,
        priceChangeHive: parseFloat(metrics.priceChangeHive),
        priceChangePercent: parseFloat(metrics.priceChangePercent),
        symbol: metrics.symbol,
        volume: metrics.volume,
        volumeExpiration: metrics.volumeExpiration        
    }

    return mapped;
}

export function mapBalanceResultToIBalance(balance) {
    let mapped: IBalance = {
        _id: balance._id,
        account: balance.account,
        balance: balance.balance,
        stake: balance.stake,
        symbol: balance.symbol
    };

    return mapped;
}
