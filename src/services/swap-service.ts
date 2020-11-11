import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import firebase from 'firebase/app';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import { loadCoins, loadTokenMetrics, loadUserBalances, loadTokens } from 'common/hive-engine-api';
import { HiveEngineService } from './hive-engine-service';
import { getPrices, usdFormat } from 'common/functions';
import { Chain } from '../common/enums';
import { loadUserBalancesSE, loadTokensSE, loadTokenMetricsSE } from '../common/steem-engine-api';
import { swapRequest } from '../common/dswap-api';

const http = new HttpClient();

@autoinject()
export class SwapService {
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

    async SwapRequest(swapRequestModel: ISwapRequestModel) {
        let toast = new ToastMessage();

        toast.message = this.i18n.tr('swapRequestWait', {
            ns: 'notifications'
        });

        let response = await swapRequest(swapRequestModel);

        console.log(response);
        
        toast.message = this.i18n.tr('swapRequestQueued', {
            ns: 'notifications'
        });

        this.toast.success(toast);

        return response;
    }

}
