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
import { HiveEngineService } from './hive-engine-service';

const http = new HttpClient();

@autoinject()
export class TokenService {
    public state: State;

    public user = {
      name: '',
      account: {}
    };

    public storeSubscription: Subscription;

    constructor(private i18n: I18N,
    private store: Store<State>,
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
}
