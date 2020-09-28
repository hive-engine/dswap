import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import firebase from 'firebase/app';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import hivejs from '@hivechain/hivejs';
import { hiveSignerJson, getAccount } from 'common/hive';
import { loadCoins, loadTokenMetrics, loadUserBalances, loadTokens } from 'common/hive-engine-api';
import { HiveEngineService } from './hive-engine-service';
import { getPrices, usdFormat } from 'common/functions';
import { Chain } from '../common/enums';
import { loadUserBalancesSE, loadTokensSE, loadTokenMetricsSE } from '../common/steem-engine-api';

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

    async getDSwapTokens(includeMetrics = true, chain: Chain = Chain.Hive) {
        const symbols = environment.swapEnabledTokens;
        let dTokens = await loadTokens(symbols);

        if (includeMetrics)
            await this.enrichTokensWithMetrics(dTokens, symbols, chain);

        this.state.tokens = dTokens;

        return dTokens;
    }    

    async enrichTokensWithMetrics(dTokens: IToken[], symbols: string[], chain: Chain) {
        let metrics = [];

        if (chain === Chain.Hive) {
            metrics = await loadTokenMetrics(symbols);
        } else if (chain === Chain.Steem) {
            metrics = await loadTokenMetricsSE(symbols);
        }
        
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

    async getDSwapTokenBalances(chain: Chain) {
        if (!this.state.tokens) {
            await this.getDSwapTokens(true, chain);
        }

        if (!this.state.tokens.find((x) => x.userBalance != null)) {
            let symbols = this.state.tokens.map(x => x.symbol);
            await this.enrichTokensWithUserBalances(symbols);
        }        
        
        return this.state.tokens;
    }

    async getMarketMakerTokens(symbols = [], chain: Chain) {
        let allTokens: any;
        let mmTokens = [];

        if (chain === Chain.Hive) {
            allTokens = await loadTokens(symbols, 1000);
            for (const token of allTokens) {
                if (environment.disabledTokens.includes(token.symbol)) {
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
