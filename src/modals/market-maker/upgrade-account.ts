import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { trimUsername, getChainByState } from 'common/functions';
import { MarketMakerService } from 'services/market-maker-service';
import { Chain } from 'common/enums';
import { environment } from 'environment';
import { TokenService } from 'services/token-service';
import { Router, Redirect } from 'aurelia-router';
import { DefaultPopupTimeOut } from "common/constants";

@autoinject()
export class UpgradeAccountModal {
    private loading = false;
    private state: IState;
    private subscription: Subscription;
    private token: any;
    private validationController;
    private renderer;
    private user;
    private marketMakerUser: IMarketMakerUser;
    private marketMakerUpgradeCost;
    private marketMakerFeeToken;
    private marketMakerStakeRequiredPremium;
    private userBalanceFeeToken;
    private userStakeFeeToken;
    private isPremium = false;
    private isPremiumFeePaid = false;
    private marketMakerStakeRequiredPerMarket;
    private currentChainId;

    constructor(private controller: DialogController,
        private mms: MarketMakerService,
        private store: Store<IState>,
        private router: Router,
        private ts: TokenService,
        private toast: ToastService,
        private i18n: I18N,
        private controllerFactory: ValidationControllerFactory) {
        this.validationController = controllerFactory.createForCurrentScope();
        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;

        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };
            }
        });
    }

    async bind() {
        this.createValidationRules();
        this.currentChainId = await getChainByState(this.state);
        this.marketMakerUpgradeCost = environment.marketMakerUpgradeCost;
        this.marketMakerFeeToken = environment.marketMakerFeeToken;
        this.marketMakerStakeRequiredPremium = environment.marketMakerStakeRequiredPremium;
        this.marketMakerStakeRequiredPerMarket = environment.marketMakerStakeRequiredPerMarket;

        if (this.user) {

            let balance = await this.ts.getUserBalanceOfToken(this.marketMakerFeeToken, this.currentChainId);
            if (balance) {
                this.userBalanceFeeToken = balance.balance;
                this.userStakeFeeToken = parseFloat(balance.stake);
            }
        }  

        if (this.marketMakerUser) {
            this.isPremium = this.marketMakerUser.isPremium;
            this.isPremiumFeePaid = this.marketMakerUser.isPremiumFeePaid;
        }
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('userStakeFeeToken')
            .satisfies((value: any, object: any) => parseFloat(value) >= this.marketMakerStakeRequiredPremium)
            .withMessageKey('errors:marketMakerUpgradeAccountInsufficientStake')
            .ensure('userBalanceFeeToken')
            .satisfies((value: any, object: any) => this.isPremiumFeePaid || parseFloat(value) >= this.marketMakerUpgradeCost)
            .withMessageKey('errors:marketMakerUpgradeAccountInsufficientBalance')
            .ensure('isPremium')
            .satisfies((value: any, object: any) => value === false)
            .withMessageKey('errors:marketMakerUpgradeAccountAlreadyPremium')
            .rules;

        this.validationController.addObject(this, rules);
    }

    async confirmUpgradeAccount() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toastMessage = new ToastMessage();

                toastMessage.message = this.i18n.tr(result.rule.messageKey, {
                    symbol: this.marketMakerFeeToken,
                    requiredStake: this.marketMakerStakeRequiredPremium,
                    userStake: this.userStakeFeeToken,
                    requiredBalance: this.marketMakerUpgradeCost,
                    userBalance: this.userBalanceFeeToken,
                    ns: 'errors'
                });
                toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;

                this.toast.error(toastMessage);
            }
        }

        if (validationResult.valid) {
            const result = await this.mms.upgradeAccount(Chain.Hive);

            if (result) {
                this.controller.ok();
            }
        }

        this.loading = false;
    }
}
