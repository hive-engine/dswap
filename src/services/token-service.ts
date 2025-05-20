import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import firebase from 'firebase/app';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import { loadCoins, loadTokenMetrics, loadUserBalances, loadTokens, fetchSettings, loadPoolTokens } from 'common/hive-engine-api';
import { HiveEngineService } from './hive-engine-service';
import { getPrices, usdFormat, getSwapTokenByCrypto, getPeggedTokenSymbolByChain } from 'common/functions';
import { Chain } from '../common/enums';
import { loadUserBalancesSE, loadTokensSE, loadTokenMetricsSE } from '../common/steem-engine-api';
import { env } from 'process';

const http = new HttpClient();

@autoinject()
export class TokenService {
    public state: IState;

    public user = {
      name: '',
      account: {}
    };

    public storeSubscription: Subscription;

    constructor(private i18n: I18N,
    private store: Store<IState>,
    private toast: ToastService,
    private hes: HiveEngineService) {
        http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(environment.FIREBASE_API_HE)
        });
        
        this.storeSubscription = this.store.state.subscribe(state => {
          if (state) {
              this.state = state;

              this.user = state.account as any;              
          }
        });        
    }

    async loadPools(){
        if (!this.state.pools) {
            let pools = await loadPoolTokens([], 1000);
            this.state.pools = pools;
        }

    }

    async getMappedMarketPools(){
        if (!this.state.pools) {
            await this.loadPools();
        }

        const pools = this.state.pools
        .filter((p) => !environment.settings?.disabled_pools.includes(p.tokenPair))
        .map<
          [string, MarketPool & { baseSymbol: string; quoteSymbol: string }]
        >((p) => {
          const [baseSymbol, quoteSymbol] = p.tokenPair.split(':');

          return [p.tokenPair, { ...p, baseSymbol, quoteSymbol }];
        })
        .filter(
          (p) =>
            !environment.settings?.deprecated_tokens.includes(p[1].baseSymbol) &&
            !environment.settings?.deprecated_tokens.includes(p[1].quoteSymbol),
        );

      return new Map(pools);
    }

    getPoolSupportedTokens(mappedMarketPools){
        const tokens = Array.from(mappedMarketPools.values())
            .map((m:any) => [m.baseSymbol, m.quoteSymbol])
            .flat();

        return Array.from(new Set(tokens));
    }

    async getDSwapTokens(includeMetrics = true, chain: Chain = Chain.Hive, poolTokens = false) {
        const symbols = environment.swapEnabledTokens;

         if (poolTokens) {
            let mappedPools = await this.getMappedMarketPools();
            let poolTokens = this.getPoolSupportedTokens(mappedPools);

            let pTokens = await loadTokens(poolTokens, 1000);

            if (includeMetrics)
                await this.enrichTokensWithMetrics(pTokens, symbols, chain);

            return pTokens;
         } else {        
            let dTokens1 = await loadTokens([], 1000);
            let dTokens2 = await loadTokens([], 1000, 1000);

            let dTokens = [...dTokens1, ...dTokens2];

            if (includeMetrics)
                await this.enrichTokensWithMetrics(dTokens, symbols, chain);

            await this.addEnabledCryptoTokens(dTokens);

            this.state.tokens = dTokens;

            return dTokens;
        }
    }   

    async addEnabledCryptoTokens(dTokens: IToken[]) {
        var cryptoTokens = environment.swapEnabledCrypto;

        if (cryptoTokens) {
            cryptoTokens = cryptoTokens.sort().reverse();
            for (const c of cryptoTokens) {
                let swapTokenSymbol = await getSwapTokenByCrypto(c);

                let token = dTokens.find(x => x.symbol == swapTokenSymbol);
                if (token) {
                    let cryptoToken = { ...token };
                    cryptoToken.symbol = c;
                    cryptoToken.name = cryptoToken.name.replace(" Pegged", "").replace(" pegged", "");
                    cryptoToken.isCrypto = true;

                    dTokens.unshift(cryptoToken);
                }
            }            
        }
    }

    async enrichTokensWithMetrics(dTokens: IToken[], symbols: string[], chain: Chain) {
        let metrics = [];

        if (chain === Chain.Hive) {
            metrics = await loadTokenMetrics(symbols);
        } else if (chain === Chain.Steem) {
            metrics = await loadTokenMetricsSE(symbols);
        }

        if (metrics && metrics.length > 0) {            
            for(const m of metrics) {
                let token = dTokens.find(x => x.symbol == m.symbol);
                if (token) {
                    m.marketCap = m.lastPrice * parseFloat(token.circulatingSupply);

                    if (Date.now() / 1000 < m.volumeExpiration) {
                        m.volume = parseFloat(m.volume);
                    }

                    if (!this.state.hivePriceUsd) {
                        let prices = await getPrices();                    
                        if (prices)
                            this.state.hivePriceUsd = prices.hive.usd;                   
                    }

                    m.lastPriceUsd = usdFormat(parseFloat(m.lastPrice), token.precision, this.state.hivePriceUsd, true); 

                    token.metrics = m;                
                }
            }
        } else {
            var peggedSymbol = await getPeggedTokenSymbolByChain(Chain.Hive);
            if (symbols.length == 1 && symbols[0] == peggedSymbol) {
                let token = dTokens.find(x => x.symbol == peggedSymbol);
                if (token) {
                    token.metrics = {
                        highestBid: 0,
                        lastPrice: 0,
                        lastPriceUsd: this.state.hivePriceUsd,
                        lowestAsk: 0,
                        marketCap: 0,
                        priceChangeHive: 0,
                        priceChangePercent: 0,
                        symbol: peggedSymbol,
                        volume: 0,
                        volumeExpiration: 0        
                    }
                }
            }
        }
    }

    async enrichTokensWithUserBalancesDcaPools(tokens) {
        let account = environment.isDebug && environment.debugAccount ? environment.debugAccount : this.user.name;
        let symbols = [];
        for (let t of tokens) {
            symbols.push(t.symbol);
        }
        
        let userBalances = await loadUserBalances(account, symbols);
        for(let t of tokens) {
            let balance = userBalances.find(x => x.symbol == t.symbol);
            if (balance) {
                t.userBalance = balance;
            } else {
                t.userBalance = { _id: 0, account: account, balance: 0, stake: "0", symbol: t.symbol };
            }
        }
    }

    async enrichTokensWithUserBalances(symbols) {
        let account = environment.isDebug && environment.debugAccount ? environment.debugAccount : this.user.name;
        let userBalances = await loadUserBalances(account, symbols);
        for(let t of this.state.tokens) {
            let balance = userBalances.find(x => x.symbol == t.symbol);
            if (balance) {
                t.userBalance = balance;
            } else {
                t.userBalance = { _id: 0, account: account, balance: 0, stake: "0", symbol: t.symbol };
            }
        }
    }

    async getUserBalanceOfToken(symbol, chain: Chain) {
        let account = environment.isDebug && environment.debugAccount ? environment.debugAccount : this.user.name;
        let userBalances = await this.getUserBalances(account, symbol, chain);        
        let balance = userBalances.find(x => x.symbol == symbol);
        if (balance) {
            return balance;
        } 

        return { _id: 0, account: account, balance: 0, stake: "0", symbol: symbol };
    }

    async getUserBalances(account, symbol, chain: Chain) {
        if (chain === Chain.Hive) {
            return loadUserBalances(account, [symbol]);
        } else if (chain === Chain.Steem) {
            return loadUserBalancesSE(account, [symbol]);
        }
    }

    async getTokenDetails(symbol, chain: Chain, includeMetrics = true, includeBalance = true) {        
        let dToken: any;
        if (this.state.tokens && this.state.tokens.length > 0) {            
            dToken = this.state.tokens.find(x => x.symbol == symbol);

            if (!dToken)
                dToken = await this.retrieveSingleToken(symbol, chain);
        } else {
            dToken = await this.retrieveSingleToken(symbol, chain);
        }

        if (includeMetrics)
            await this.enrichTokensWithMetrics([dToken], [symbol], chain);

        if (includeBalance)
            dToken.userBalance = await this.getUserBalanceOfToken(symbol, chain);

        return dToken;
    }

    async retrieveSingleToken(symbol, chain: Chain) {
        let dToken: any;
        if (chain === Chain.Hive) {
            let tokenRes = await loadTokens([symbol])
            if (tokenRes)
                dToken = tokenRes[0];
        } else if (chain === Chain.Steem) {
            let tokenRes = await loadTokensSE([symbol])
            if (tokenRes)
                dToken = tokenRes[0];
        }        
        return dToken;
    }

    async getDSwapTokenBalances(chain: Chain, forceReload?: boolean) {
        if (!this.state.tokens) {
            await this.getDSwapTokens(true, chain);
        }

        if (!this.state.tokens.find((x) => x.userBalance != null) || forceReload) {
            let symbols = this.state.tokens.map(x => x.symbol);
            await this.enrichTokensWithUserBalances(symbols);
        }        
        
        return this.state.tokens;
    }

    async getMarketMakerTokens(symbols = [], chain: Chain) {
        let allTokens: any;
        let mmTokens = [];
        let disabledTokens = null;

         if (!environment.settings) {
            environment.settings = await fetchSettings();

            if (environment.settings && environment.settings.disabled_tokens) {
                disabledTokens = environment.settings.disabled_tokens;
            } else {
                disabledTokens = environment.disabledTokens;
            }
        } else {
            disabledTokens = environment.settings.disabled_tokens;
        }

        if (chain === Chain.Hive) {
            allTokens = await loadTokens(symbols, 1000);
            for (const token of allTokens) {
                if (disabledTokens.includes(token.symbol)) {
                    continue;
                }

                mmTokens.push(token);
            }
        } else if (chain === Chain.Steem) {
            allTokens = await loadTokensSE(symbols, 1000);
            for (const token of allTokens) {
                if (environment.disabledTokens_SE.includes(token.symbol)) {
                    continue;
                }

                mmTokens.push(token);
            }
        }

        return mmTokens;
    }
}
