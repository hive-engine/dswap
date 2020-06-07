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
import { loadCoins } from 'common/hive-engine-api';

const http = new HttpClient();

@autoinject()
export class HiveEngineService {
    public http: HttpClient;
    public state: State;

    public user = {
      name: '',
      account: {}
    };

    public storeSubscription: Subscription;

    constructor(@lazy(HttpClient) getHttpClient: () => HttpClient,
    private i18n: I18N,
    private store: Store<State>,
    private toast: ToastService) {
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

    async getPeggedTokens() {        
        const coins = await loadCoins();
        let peggedCoins = coins.filter(x => x.coin_type === 'hiveengine');

        const hive = { display_name: 'HIVE', symbol: 'SWAP.HIVE', symbol_id: 'SWAP.HIVE' } as ICoin;
        peggedCoins.push(hive);

        this.state.peggedTokens = peggedCoins;

        return peggedCoins;
    }    
}
