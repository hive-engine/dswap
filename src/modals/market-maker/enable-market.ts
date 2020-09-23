import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { trimUsername, totalStakeRequiredToEnableMarket, getChainByState } from 'common/functions';
import { MarketMakerService } from 'services/market-maker-service';
import { Chain } from 'common/enums';
import { environment } from 'environment';
import { TokenService } from 'services/token-service';
import { DefaultPopupTimeOut } from "common/constants";

@autoinject()
export class EnableMarketModal {
    private loading = false;
    private state: IState;
    private subscription: Subscription;
    private token: any;
    private validationController;
    private renderer;
    private marketMakerUser;
    private symbol;
    private market: IMarketMakerMarket;
    private tokenOperationCost;
    private user;
    private tokenUserStake;
    private allowedToEnableMarket = false;
    private requiredStake;
    private isPremium;
    private totalStakeRequired;
    private feeTokenSymbol;
    private currentChainId;

    constructor(private controller: DialogController,
        private toast: ToastService,
        private taskQueue: TaskQueue,
        private store: Store<IState>,
        private controllerFactory: ValidationControllerFactory,
        private i18n: I18N,
        private mms: MarketMakerService,
        private ts: TokenService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;
        this.subscription = this.store.state.subscribe((state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...this.state.firebaseUser };
                this.marketMakerUser = { ...this.state.marketMakerUser };
            }
        });
    }

    async activate(market) {        
        this.market = market;
        this.currentChainId = await getChainByState(this.state);
        this.tokenOperationCost = environment.marketMakerStakeRequiredPerMarket;     
        this.symbol = this.market.symbol;
        this.feeTokenSymbol = environment.marketMakerFeeToken;

        if (this.user) {
            let balance = await this.ts.getUserBalanceOfToken(this.feeTokenSymbol, this.currentChainId);
            if (balance)
                this.tokenUserStake = parseFloat(balance.stake);

            if (this.marketMakerUser) {
                this.totalStakeRequired = await totalStakeRequiredToEnableMarket(this.marketMakerUser);
                this.allowedToEnableMarket = this.tokenUserStake >= this.totalStakeRequired;
                this.isPremium = this.marketMakerUser.isPremium;
            }
        }     

        this.createValidationRules();
    }

    async confirmEnableMarket() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toastMessage = new ToastMessage();               

                toastMessage.message = this.i18n.tr(result.rule.messageKey, {
                    symbol: this.feeTokenSymbol,
                    requiredStake: this.requiredStake,
                    userStake: this.tokenUserStake,
                    ns: 'errors'
                });
                toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;

                this.toast.error(toastMessage);
            }
        }

        if (validationResult.valid) {
            const result = await this.mms.enableMarket(Chain.Hive, this.market.symbol);

            if (result) {
                this.controller.ok();
            }

            this.loading = false;
        }
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('symbol')
            .required()
            .withMessageKey('errors:marketMakerAddMarketTokenRequired')
            .ensure('allowedToEnableMarket')
            .satisfies((value: any, object: any) => value === true)
            .withMessageKey('errors:marketMakerAddMarketMoreStakeRequired')
            .rules;

        this.validationController.addObject(this, rules);
    }
}
