import { loadAccountBalances } from 'store/actions';
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

    async getDSwapTokens() {        
        let heTokens = await this.hes.getPeggedTokens();

        this.state.tokens = heTokens;

        return heTokens;
    }    

    async getDSwapTokenBalances() {
        let tokenBalances: IBalance[] = [];

        if (!this.state.account.balances) {
            await loadAccountBalances(this.state);
        }

        if (!this.state.tokens) {
            await this.getDSwapTokens();
        }

        if (this.state.account.balances && this.state.tokens) {
            this.FillTokenBalances(tokenBalances);   
            this.GetTokenDataForMissingBalances(tokenBalances);
        }

        return tokenBalances;
    }

    private async GetTokenDataForMissingBalances(tokenBalances: IBalance[]) {
        const tokensMissingData = tokenBalances.filter(x => x._id == 0);
        const symbols = tokensMissingData.map(x => x.symbol);
        console.log(symbols);

        const tokens = await loadTokens(symbols);

        for (let i = 0; i < tokens.length; i++) {
            let metric = tokens[i];

            let token = tokenBalances.find(x => x.symbol == metric.symbol);
            if (token)
            {
                token.lastPrice = metric.lastPrice;
                token.priceChangeHive = metric.priceChangeHive;
                token.priceChangePercent = metric.priceChangePercent;
            }
        }
        console.log(tokens);
    }

    private async FillTokenBalances(tokenBalances: IBalance[]) {
        let tokenSymbols = this.state.tokens.map(x => x.symbol);

        for (let i = 0; i < this.state.tokens.length; i++) {
            let token = this.state.tokens[i];

            var tBalance = this.state.account.balances.find(x => token.symbol == x.symbol);            
            if (tBalance) {
                tokenBalances.push(tBalance);
            } else {
                let newBalance: IBalance = {
                    _id: 0,
                    metric: 0,
                    priceChangeHive: 0,
                    account: this.user.name,
                    balance: "0",
                    lastPrice: 0,
                    name: token.display_name,
                    priceChangePercent: 0,
                    symbol: token.symbol,
                    usdValue: 0,
                    usdValueFormatted: "0",
                    metadata: ""
                };

                tokenBalances.push(newBalance);
            }
        }       
    }
}
