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
                .withBaseUrl(environment.FIREBASE_API)
        });
        
        this.storeSubscription = this.store.state.subscribe(state => {
          if (state) {
              this.state = state;

              this.user = state.account as any;              
          }
        });        
    }

    async getDSwapTokens(includeMetrics = true) {
        const symbols = environment.swapEnabledTokens;
        let dTokens = await loadTokens(symbols);

        if (includeMetrics)
            await this.enrichTokensWithMetrics(dTokens, symbols);

        this.state.tokens = dTokens;

        return dTokens;
    }    

    async enrichTokensWithMetrics(dTokens: IToken[], symbols: string[]) {
        let metrics = await loadTokenMetrics(symbols);
        
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
        let userBalances = await loadUserBalances(this.user.name, symbols);
        for(let t of this.state.tokens) {
            let balance = userBalances.find(x => x.symbol == t.symbol);
            if (balance) {
                t.userBalance = balance;
            } else {
                t.userBalance = { _id: 0, account: this.user.name, balance: 0, stake: "0", symbol: t.symbol };
            }
        }
    }

    async getUserBalanceOfToken(symbol) {
        let userBalances = await loadUserBalances(this.user.name, [symbol]);        
        let balance = userBalances.find(x => x.symbol == symbol);
        if (balance) {
            return balance;
        } 

        return { _id: 0, account: this.user.name, balance: 0, stake: "0", symbol: symbol };
    }

    async getTokenDetails(symbol, includeMetrics = true, includeBalance = true) {
        let dToken: any;
        if (this.state.tokens && this.state.tokens.length > 0) {            
            dToken = this.state.tokens.find(x => x.symbol == symbol);

            if (!dToken)
                dToken = await this.retrieveSingleToken(symbol);
        } else {
            dToken = await this.retrieveSingleToken(symbol);
        }

        if (includeMetrics)
            await this.enrichTokensWithMetrics([dToken], [symbol]);

        if (includeBalance)
            dToken.userBalance = await this.getUserBalanceOfToken(symbol);

        return dToken;
    }

    async retrieveSingleToken(symbol) {
        let dToken: any;

        let tokenRes = await loadTokens([symbol])
        if (tokenRes)
            dToken = tokenRes[0];

        return dToken;
    }

    async getDSwapTokenBalances() {
        if (!this.state.tokens) {
            await this.getDSwapTokens();
        }

        if (!this.state.tokens.find((x) => x.userBalance != null)) {
            let symbols = this.state.tokens.map(x => x.symbol);
            await this.enrichTokensWithUserBalances(symbols);
        }        
        
        return this.state.tokens;
    }

    async getMarketMakerTokens() {
        let allTokens = await loadTokens([], 1000);
        let mmTokens = [];

        for (const token of allTokens) {
            if (environment.disabledTokens.includes(token.symbol)) {
                continue;
            }

            mmTokens.push(token);
        }

        return mmTokens;
    }
}
