import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import moment from 'moment';
import { loadMarkets } from 'common/market-maker-api';

const http = new HttpClient();

@autoinject()
export class MarketMakerService {
    public http: HttpClient;
    public state: IState;

    public user = {
        name: '',
        account: {}
    };

    public marketMakerUser = {

    }

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
                this.marketMakerUser = state.marketMakerUser;
            }
        });
    }

    async getMarkets() {
        let markets = await loadMarkets();

        return markets;
    }
}
