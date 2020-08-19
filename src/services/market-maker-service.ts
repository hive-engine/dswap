import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import moment from 'moment';
import { loadMarkets } from 'common/market-maker-api';
import { Chain } from 'common/enums';
import { hiveSignerJson } from 'common/hive';

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

    getUser() {
        return this.user?.name ?? null;
    }

    async register(chain: Chain): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'register',
            contractPayload: {}
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Register for Market Maker', async (response) => {
                        resolve(this.processResponseRegisterKeychain(response));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }    

    processResponseRegisterKeychain(response) {
        if (response.success && response.result) {
            try {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerRegisterSuccessful', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }
}
