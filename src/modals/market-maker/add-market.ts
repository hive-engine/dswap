import { dispatchify, Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { DialogController } from "aurelia-dialog";
import { autoinject, TaskQueue, bindable } from "aurelia-framework";
import { MarketMakerService } from "services/market-maker-service";
import { TokenService } from "services/token-service";
import { ToastService, ToastMessage } from "services/toast-service";
import { I18N } from "aurelia-i18n";
import { ValidationControllerFactory, ValidationRules, ControllerValidateResult } from "aurelia-validation";
import { Router, Redirect } from 'aurelia-router';
import { BootstrapFormRenderer } from "resources/bootstrap-form-renderer";
import { environment } from 'environment';
import { Chain } from "common/enums";
import { totalStakeRequiredToAddMarket } from "common/functions";

@autoinject()
export class AddMarketModal {
    public subscription: Subscription;
    private state: IState;
    private tokenSymbol;
    private tokenUserStake = 0;
    private tokenOperationCost;
    private validationController;
    private renderer;
    private user;
    private marketMakerUser : IMarketMakerUser;
    private mmTokens;
    private selectedTokenSymbol;
    private selectedToken;
    private loading = false;
    private market: IMarketMakerMarket;
    private isEnabled = true;
    private baseToken;
    private maxBidPrice = "";
    private minSellPrice = "";
    private maxBaseToSpend = "";
    private minBaseToSpend = "";
    private maxTokensToSell = "";
    private minTokensToSell = "";
    private priceIncrement = "";
    private minSpread = "";
    private maxDistFromNext = "";
    private ignoreOrderQtyLt = "";
    private allowedToAddMarket = false;    
    private totalStakeRequired;

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

                if (this.marketMakerUser && this.marketMakerUser._id && this.marketMakerUser._id > 0) {
                    //this.router.navigate('market-maker-dashboard');
                }
            }
        });
    }

    async bind() {
        this.createValidationRules();

        this.tokenSymbol = environment.marketMakerFeeToken;
        this.baseToken = environment.peggedToken;
        this.mmTokens = await this.ts.getMarketMakerTokens();
        this.tokenOperationCost = environment.marketMakerStakeRequiredPerMarket;        

        if (this.user) {
            let balance = await this.ts.getUserBalanceOfToken(this.tokenSymbol);
            if (balance)
                this.tokenUserStake = parseFloat(balance.stake);

            if (this.marketMakerUser) {
                this.totalStakeRequired = await totalStakeRequiredToAddMarket(this.marketMakerUser);
                this.allowedToAddMarket = this.tokenUserStake >= this.totalStakeRequired;
            }
        }        
    }

    tokenSelected() {
        this.selectedTokenSymbol = this.selectedToken.symbol;
    }

    async confirmAddMarket() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr(result.rule.messageKey, {                    
                    symbol: this.selectedTokenSymbol,
                    feeTokenSymbol: this.tokenSymbol,
                    requiredStake: this.totalStakeRequired,
                    userStake: this.tokenUserStake,
                    ns: 'errors'
                });

                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {
            this.market = {
                symbol: this.selectedTokenSymbol,
                isEnabled: this.isEnabled,
                ignoreOrderQtyLt: this.parseAddMarketNumberFieldValue(this.ignoreOrderQtyLt),
                maxBaseToSpend: this.parseAddMarketNumberFieldValue(this.maxBaseToSpend),
                maxBidPrice: this.parseAddMarketNumberFieldValue(this.maxBidPrice),
                maxDistFromNext: this.parseAddMarketNumberFieldValue(this.maxDistFromNext),
                maxTokensToSell: this.parseAddMarketNumberFieldValue(this.maxTokensToSell),
                minBaseToSpend: this.parseAddMarketNumberFieldValue(this.minBaseToSpend),
                minSellPrice: this.parseAddMarketNumberFieldValue(this.minSellPrice),
                minSpread: this.parseAddMarketNumberFieldValue(this.minSpread),
                minTokensToSell: this.parseAddMarketNumberFieldValue(this.minTokensToSell),
                priceIncrement: this.parseAddMarketNumberFieldValue(this.priceIncrement)
            };

            const result = await this.mms.addMarket(Chain.Hive, this.market);

            if (result) {
                this.controller.ok();
            }
        }
        this.loading = false;
    }

    parseAddMarketNumberFieldValue(val) {
        if (val && !isNaN(val) && val.length > 0)
            return parseFloat(val);

        return null;
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('selectedTokenSymbol')
            .required()
            .withMessageKey('errors:marketMakerAddMarketTokenRequired')
            .ensure('tokenUserStake')
            .satisfies((value: any, object: any) => parseFloat(value) >= this.totalStakeRequired)
            .withMessageKey('errors:marketMakerAddMarketMoreStakeRequired')
            .ensure('maxBidPrice')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMaxBidPriceNaN')
            .ensure('minSellPrice')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMinSellPriceNaN')
            .ensure('maxBaseToSpend')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMaxBaseToSpendNaN')
            .ensure('minBaseToSpend')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMinBaseToSpendNaN')
            .ensure('maxTokensToSell')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMaxTokensToSellNaN')
            .ensure('minTokensToSell')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMinTokensToSellNaN')
            .ensure('priceIncrement')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketPriceIncrementNaN')
            .ensure('minSpread')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMinSpreadNaN')
            .ensure('maxDistFromNext')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketMaxDistFromNextNaN')
            .ensure('ignoreOrderQtyLt')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketIgnoreOrderQtyLtNaN')
            .rules;

        this.validationController.addObject(this, rules);
    }
}
