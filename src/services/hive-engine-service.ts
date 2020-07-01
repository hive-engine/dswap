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
import { loadCoins, loadCoinPairs } from 'common/hive-engine-api';

const http = new HttpClient();

@autoinject()
export class HiveEngineService {
    public http: HttpClient;
    public state: IState;

    public user = {
      name: '',
      account: {}
    };

    public storeSubscription: Subscription;

    constructor(@lazy(HttpClient) getHttpClient: () => HttpClient,
    private i18n: I18N,
    private store: Store<IState>,
    private toast: ToastService) {
        this.http = getHttpClient();

        this.http.configure(config => {
            config
                .useStandardConfiguration()
        });
        
        this.storeSubscription = this.store.state.subscribe(state => {
          if (state) {
              this.state = state;

              this.user = state.account as any;              
          }
        });        
    }  

    getUser() {
        return this.user?.name ?? null;
    }

    async getDepositAddress(symbol) {
        const pairs = await this.getFormattedCoinPairs();   
        const peggedToken = pairs.find(p => p.pegged_token_symbol === symbol);
        console.log(peggedToken);
        if (!peggedToken) {
            return;
        }

        try {
            const userName = this.getUser();

            if (userName == null || userName == '') {
                throw new Error('User is unknown');
            }

            const request = await this.http.fetch(`${environment.CONVERTER_API}convert/`, {
                method: 'POST',
                body: json({ from_coin: peggedToken.symbol, to_coin: peggedToken.pegged_token_symbol, destination: userName })
            });

            const response = await request.json();

            return { ...response, ...peggedToken };
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async getFormattedCoinPairs() {
        const coins = await loadCoins();
        const pairs = await loadCoinPairs();
    
        let tokenPairs = [];
        const nonPeggedCoins = coins.filter(x => x.coin_type !== 'hiveengine');
    
        const hive = { name: 'HIVE', symbol: 'HIVE', pegged_token_symbol: 'SWAP.HIVE' };
        tokenPairs.push(hive);

        for (const x of nonPeggedCoins) {
            // find pegged coin for each non-pegged coin
            const coinFound = pairs.find(y => y.from_coin_symbol === x.symbol);
            
            if (coinFound) {
                const tp = {
                    name: x.display_name,
                    symbol: x.symbol,
                    pegged_token_symbol: coinFound.to_coin_symbol
                }
                
                // check if the token exists
                if (!tokenPairs.find(x => x.symbol == tp.symbol)) {
                    tokenPairs.push(tp);
                }
            }
        }

        // sort the coins
        tokenPairs = tokenPairs.sort((a, b) => a.name.localeCompare(b.name));

        return tokenPairs;
    }
}
