import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import styles from './dswap-order.module.css';

@autoinject()
export class DswapOrderModal {
    @bindable amount;
    @bindable username;

    private styles = styles;
    private loading = false;
    private subscription: Subscription;   
    private token: any;
    private validationController;
    private renderer;

    constructor(private controller: DialogController, private toast: ToastService, private taskQueue: TaskQueue, private controllerFactory: ValidationControllerFactory, private i18n: I18N) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;    
    }

    bind() {
        this.createValidationRules();
    }

    async activate(symbol) {        
        //this.token = this.state.account.balances.find(x => x.symbol === symbol);        
    }

    balanceClicked() {
        this.amount = this.token.stake;
    }

    private createValidationRules() {
        const rules = ValidationRules.ensure('amount')
            .required()
            .withMessageKey('errors:amountRequired')
            .then()
            .satisfies((value: any, object: any) => parseFloat(value) > 0)
            .withMessageKey('errors:amountGreaterThanZero')
            .satisfies((value: any, object: DswapOrderModal) => {
                const amount = parseFloat(value);

                return amount <= object.token.stake;
            })
            .withMessageKey('errors:insufficientBalanceForDelegate')
            .ensure('username')
            .required()
            .withMessageKey('errors:usernameRequired').rules;

        this.validationController.addObject(this, rules);
    }

    async confirmSend() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr(result.rule.messageKey, {
                    stake: this.token.stake,
                    symbol: this.token.symbol,
                    ns: 'errors'
                });

                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {                       

            //let username = trimUsername(this.username);
            //const result = await this.se.delegate(this.token.symbol, this.amount, username);

            // if (result) {
            //     this.controller.ok();
            // }
        }

        this.loading = false;
    }
}
