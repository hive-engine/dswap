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
        const symbols = environment.enabledTokens;
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

    async enrichTokensWithUserBalances() {
        let userBalances = await loadUserBalances(this.user.name, environment.enabledTokens);
        for(let t of this.state.tokens) {
            let balance = userBalances.find(x => x.symbol == t.symbol);
            if (balance) {
                t.userBalance = balance;
            } else {
                t.userBalance = { _id: 0, account: this.user.name, balance: 0, stake: "0", symbol: t.symbol };
            }
        }
    }

    async getDSwapTokenBalances() {
        if (!this.state.tokens) {
            await this.getDSwapTokens();
        }

        if (!this.state.tokens.find((x) => x.userBalance != null)) {
            await this.enrichTokensWithUserBalances();
        }        
        
        return this.state.tokens;
    }
}
