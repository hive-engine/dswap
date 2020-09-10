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
import { DefaultPopupTimeOut } from "common/constants";

@autoinject()
export class EnableAccountModal {
    private loading = false;
    private state: IState;
    private subscription: Subscription;
    private token: any;
    private validationController;
    private renderer;
    private marketMakerUser;
    private accountIsEnabled;

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

    bind() {
        this.accountIsEnabled = this.marketMakerUser.isEnabled;
        this.createValidationRules();
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('accountIsEnabled')
            .satisfies((value: any, object: any) => value === false)
            .withMessageKey('errors:marketMakerEnableAccountAccountMustBeDisabled')            
            .rules;

        this.validationController.addObject(this, rules);
    }

    async confirmEnable() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toastMessage = new ToastMessage();

                toastMessage.message = this.i18n.tr(result.rule.messageKey, {
                    account: this.marketMakerUser.account,
                    ns: 'errors'
                });
                toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;

                this.toast.error(toastMessage);
            }
        }

        if (validationResult.valid) {
            const result = await this.mms.enableAccount(Chain.Hive);

            if (result) {
                this.controller.ok();
            }
        }

        this.loading = false;
    }
}
