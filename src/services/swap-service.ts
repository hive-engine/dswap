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
import { calculateSwapInput, calculateSwapOutput, swapRequest, swapRequestDca, swapRequestDcaCancel } from '../common/dswap-api';

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

    async SwapRequest(model: ISwapRequestModel) {
        //let toastWait = new ToastMessage();
        //toastWait.message = this.i18n.tr('swapRequestInProgress', {
        //    ns: 'notifications'
        //});
        //toastWait.overrideOptions.timeout = 2000;
        //this.toast.warning(toastWait);

        let response = await swapRequest(model);
        console.log(response);
        if (!response || !response.Id) {
            let toastFailure = new ToastMessage();
            toastFailure.overrideOptions.timeout = 2000;
            toastFailure.message = this.i18n.tr('swapRequestQueueFailed', {
                ns: 'errors'
            });

            this.toast.error(toastFailure);
        } else {            
            //let toastSuccess = new ToastMessage();

            //toastSuccess.message = this.i18n.tr('swapRequestInProgress', {
            //    ns: 'notifications'
            //});

            //this.toast.success(toastSuccess);
        }

        return response;
    }

    async SwapRequestDCA(model: ISwapRequestDCAModel) {
        //let toastWait = new ToastMessage();
        //toastWait.message = this.i18n.tr('swapRequestInProgress', {
        //    ns: 'notifications'
        //});
        //toastWait.overrideOptions.timeout = 2000;
        //this.toast.warning(toastWait);

        let response = await swapRequestDca(model);
        console.log(response);
        if (!response || !response.Id) {
            let toastFailure = new ToastMessage();
            toastFailure.overrideOptions.timeout = 2000;
            toastFailure.message = this.i18n.tr('swapRequestQueueFailed', {
                ns: 'errors'
            });

            this.toast.error(toastFailure);
        } else {            
            //let toastSuccess = new ToastMessage();

            //toastSuccess.message = this.i18n.tr('swapRequestInProgress', {
            //    ns: 'notifications'
            //});

            //this.toast.success(toastSuccess);
        }

        return response;
    }

    async CancelSwapRequestDCA(model: IDCACancelRequestModel) {
        //let toastWait = new ToastMessage();
        //toastWait.message = this.i18n.tr('swapRequestInProgress', {
        //    ns: 'notifications'
        //});
        //toastWait.overrideOptions.timeout = 2000;
        //this.toast.warning(toastWait);

        let response = await swapRequestDcaCancel(model);
        console.log(response);
        if (!response || !response.Id) {
            let toastFailure = new ToastMessage();
            toastFailure.overrideOptions.timeout = 2000;
            toastFailure.message = this.i18n.tr('swapRequestQueueFailed', {
                ns: 'errors'
            });

            this.toast.error(toastFailure);
        } else {            
            //let toastSuccess = new ToastMessage();

            //toastSuccess.message = this.i18n.tr('swapRequestInProgress', {
            //    ns: 'notifications'
            //});

            //this.toast.success(toastSuccess);
        }

        return response;
    }

    async CalculateSwapOutput(model: ISwapCalcValuesModel) {
        let response = await calculateSwapOutput(model);
        if (!response) {
            let toastFailure = new ToastMessage();
            toastFailure.overrideOptions.timeout = 2000;
            toastFailure.message = this.i18n.tr('calculateSwapOutputFailed', {
                ns: 'errors'
            });

            this.toast.error(toastFailure);
        } 

        return response;
    }

    async CalculateSwapInput(model: ISwapCalcValuesModel) {
        let response = await calculateSwapInput(model);
        if (!response) {
            let toastFailure = new ToastMessage();
            toastFailure.overrideOptions.timeout = 2000;
            toastFailure.message = this.i18n.tr('calculateSwapInputFailed', {
                ns: 'errors'
            });

            this.toast.error(toastFailure);
        }

        return response;
    }

}
