export function mapTokenResultToIToken(token) {    
    let mapped : IToken = {
        _id: token._id,
        circulatingSupply: token.circulatingSupply,        
        maxSupply: token.maxSupply,
        metadata: mapMetadataToTokenMetadata(token.metadata),
        name: token.name,
        precision: token.precision,        
        supply: token.supply,
        symbol: token.symbol,
        isCrypto: false
    }

    return mapped;
}

export function mapResultToMarketPool(p) {    
    let tokenPairSplit = p.tokenPair.split(":");
    let mapped : MarketPool = {
        _id: p._id,
        tokenPair: p.tokenPair,
        baseQuantity: p.baseQuantity,
        baseVolume: p.baseVolume,
        basePrice: p.basePrice,
        quoteQuantity: p.quoteQuantity,
        quoteVolume: p.quoteVolume,
        quotePrice: p.quotePrice,
        totalShares: p.totalShares,
        precision: p.precision,
        creator: p.creator,
        token1: tokenPairSplit[0],
        token2: tokenPairSplit[1]
    }

    return mapped;
}

export function mapMetadataToTokenMetadata(metadata) {
    let metadataParsed = JSON.parse(metadata);

    let mapped: ITokenMetadata = {
        desc: metadataParsed.desc,
        icon: metadataParsed.icon,
        url: metadataParsed.url
    };

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
