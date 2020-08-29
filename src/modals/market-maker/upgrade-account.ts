import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { trimUsername } from 'common/functions';
import { MarketMakerService } from 'services/market-maker-service';
import { Chain } from 'common/enums';
import { environment } from '../../../aurelia_project/environments/dev';

@autoinject()
export class UpgradeAccountModal {
    private loading = false;
    private state: IState;
    private subscription: Subscription;
    private token: any;
    private validationController;
    private renderer;
    private marketMakerUser;
    private marketMakerUpgradeCost;
    private marketMakerFeeToken;
    private marketMakerStakeRequiredPremium;

    constructor(private controller: DialogController,
        private toast: ToastService,
        private taskQueue: TaskQueue,
        private store: Store<IState>,
        private controllerFactory: ValidationControllerFactory,
        private i18n: I18N,
        private mms: MarketMakerService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;
        this.subscription = this.store.state.subscribe((state: IState) => {
            if (state) {
                this.state = state;

                this.marketMakerUser = { ...this.state.marketMakerUser };
            }
        });
    }

    async bind() {
        this.marketMakerUpgradeCost = environment.marketMakerUpgradeCost;
        this.marketMakerFeeToken = environment.marketMakerFeeToken;
        this.marketMakerStakeRequiredPremium = environment.marketMakerStakeRequiredPremium;
    }

    async confirmUpgradeAccount() {
        this.loading = true;

        const result = await this.mms.disableAccount(Chain.Hive);

        if (result) {
            this.controller.ok();
        }

        this.loading = false;
    }
}
