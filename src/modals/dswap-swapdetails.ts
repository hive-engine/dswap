import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import styles from './dswap-swapdetails.module.css';
import { HiveEngineService } from 'services/hive-engine-service';
import { environment } from 'environment';
import { SwapService } from 'services/swap-service';
import { swapRequest, getSwapRequestTransactions } from 'common/dswap-api';
import { getPeggedTokenSymbolByChain, getBlockExplorerByChain, getSwapStatusById, getSwapStepById } from 'common/functions';
import moment from 'moment';

@autoinject()
export class DswapSwapdetailsModal {
    @bindable amount;
    @bindable username;

    private styles = styles;
    private loading = false;
    private subscription: Subscription;   
    private token: any;
    private validationController;
    private renderer;
    private swapRequestModel: ISwapRequestViewModel;
    private baseTokenSymbol;
    private blockExplorerUrl;
    private swapTransactions: ISwapRequestTransactionViewModel[];
    private swapStatusName;

    constructor(private controller: DialogController, private toast: ToastService, private taskQueue: TaskQueue,
        private controllerFactory: ValidationControllerFactory, private i18n: I18N, private hes: HiveEngineService, private ss: SwapService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;    
    }

    bind() {
        
    }

    async activate(swapRequestModel: ISwapRequestViewModel) {
        this.loading = true;
        this.swapRequestModel = swapRequestModel;
        this.swapStatusName = getSwapStatusById(swapRequestModel.SwapStatusId);
        this.baseTokenSymbol = await getPeggedTokenSymbolByChain(swapRequestModel.Chain);
        this.blockExplorerUrl = await getBlockExplorerByChain(swapRequestModel.Chain);
        this.swapTransactions = await getSwapRequestTransactions(swapRequestModel.Id)
        for (let t of this.swapTransactions) {
            t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
            t.timestamp_day = moment(t.CreatedAt).format('DD');
            t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
            t.timestamp_year = moment(t.CreatedAt).format('YYYY');
            t.SwapStatusName = await getSwapStatusById(t.SwapStatusId);
            t.SwapStepName = await getSwapStepById(t.SwapStepId);
        }
        
        this.loading = false;
    }

    balanceClicked() {
        this.amount = this.token.stake;
    }
}
