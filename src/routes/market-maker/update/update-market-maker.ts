import { OrderStrategy } from 'common/enums';
import { autoinject, bindable } from "aurelia-framework";
import { Store, dispatchify } from "aurelia-store";
import { Router } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { MarketMakerService } from "services/market-maker-service";
import { TokenService } from "services/token-service";
import { environment } from 'environment';
import { ToastService, ToastMessage } from "services/toast-service";
import { I18N } from "aurelia-i18n";
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from "aurelia-validation";
import { BootstrapFormRenderer } from "resources/bootstrap-form-renderer";
import { Chain } from "common/enums";
import { DialogService, DialogCloseResult } from "aurelia-dialog";
import { DisableMarketModal } from "modals/market-maker/disable-market";
import { EnableMarketModal } from "modals/market-maker/enable-market";
import { RemoveMarketModal } from "modals/market-maker/remove-market";
import { UpgradeAccountModal } from "modals/market-maker/upgrade-account";
import { DefaultPopupTimeOut } from 'common/constants';
import { getChainByState, getPeggedTokenSymbolByChain, getFeeTokenSymbolByChain } from 'common/functions';

@autoinject()
export class UpdateMarketMaker {
    public subscription: Subscription;
    private state: IState;
    private feeTokenSymbol;
    private feeTokenUserBalance = 0;
    private tokenOperationCost;
    private validationController;
    private renderer;
    private user;
    private marketMakerUser : IMarketMakerUser;
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
    private orderStrategies;
    private selectedOrderStrategy;
    private placeAtBidWall = "";
    private placeAtSellWall = "";
    private currentChainId;

    constructor(private dialogService: DialogService, 
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

        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };
            }
        });
    }

    async canActivate({symbol}) {
        this.selectedTokenSymbol = symbol;
        this.currentChainId = await getChainByState(this.state);
        this.selectedToken = await this.ts.getTokenDetails(this.selectedTokenSymbol, this.currentChainId);
    }    

    async loadMarketDetails() {
        if (this.selectedTokenSymbol) {       
            if (this.marketMakerUser) 
                this.orderStrategies = this.mms.getMarketMakerOrderStrategiesByUser(this.marketMakerUser);  

            const getMarketsRes = await this.mms.getUserMarkets([this.selectedTokenSymbol], this.currentChainId);
            if (getMarketsRes)
                this.market = getMarketsRes[0];

            console.log(this.market);
            let defaultStrategyId = OrderStrategy.TopOfTheBook;
            let stratFound;
            if (this.marketMakerUser.isPremium) {
                stratFound = this.orderStrategies.find(x => x._id === this.market.strategy);
            } else {
                stratFound = this.orderStrategies.find(x => x._id === defaultStrategyId);
            }
            
            this.selectedOrderStrategy = stratFound;
            this.ignoreOrderQtyLt = this.market.ignoreOrderQtyLt.toString();
            this.maxBaseToSpend = this.market.maxBaseToSpend.toString();
            this.maxBidPrice = this.market.maxBidPrice.toString();
            this.maxDistFromNext = this.market.maxDistFromNext.toString();
            this.maxTokensToSell = this.market.maxTokensToSell.toString();
            this.minBaseToSpend = this.market.minBaseToSpend.toString();
            this.minSellPrice = this.market.minSellPrice.toString();
            this.minSpread = this.market.minSpread.toString();
            this.minTokensToSell = this.market.minTokensToSell.toString();
            this.priceIncrement = this.market.priceIncrement.toString();
            this.isEnabled = this.market.isEnabled;      
            this.placeAtBidWall = this.market.placeAtBidWall.toString();
            this.placeAtSellWall = this.market.placeAtSellWall.toString();
        }
    }

    async bind() {
        this.createValidationRules();               
        this.loadMarketDetails();
        this.feeTokenSymbol = await getFeeTokenSymbolByChain(this.currentChainId);
        this.baseToken = await getPeggedTokenSymbolByChain(this.currentChainId);

        if (!this.marketMakerUser.isPremium)
            this.tokenOperationCost = environment.marketMakerUpdateMarketCostBasic;
        else 
            this.tokenOperationCost = 0;
        
        this.loadUserDetails();
    }

    upgradeAccount() {
        this.dialogService
            .open({ viewModel: UpgradeAccountModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    async loadUserDetails() {
        if (this.user) {
            let balance = await this.ts.getUserBalanceOfToken(this.feeTokenSymbol, this.currentChainId);
            if (balance)
                this.feeTokenUserBalance = balance.balance;
        }        
    }

    async updateMarket() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;

        for (const result of validationResult.results) {
            if (!result.valid) {
                const toastMessage = new ToastMessage();

                toastMessage.message = this.i18n.tr(result.rule.messageKey, {
                    feeTokenSymbol: this.feeTokenSymbol,
                    symbol: this.selectedTokenSymbol,
                    requiredBalance: this.tokenOperationCost,
                    userBalance: this.feeTokenUserBalance,
                    ns: 'errors'                    
                });
                toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;

                this.toast.error(toastMessage);
            }
        }

        if (validationResult.valid) {
            let updatedFieldCount = 0;
            let updatedMarket = { 
                symbol: this.selectedTokenSymbol,
                strategy: null,
                ignoreOrderQtyLt: null,
                maxBaseToSpend: null,
                maxBidPrice: null,
                maxDistFromNext: null,
                maxTokensToSell: null,
                minBaseToSpend: null,
                minSellPrice: null,
                minSpread: null,
                minTokensToSell: null,
                priceIncrement: null,
                placeAtBidWall: null,
                placeAtSellWall: null
            };

            if (this.marketMakerUser.isPremium) {
                if (this.selectedOrderStrategy._id != this.market.strategy) {                
                    updatedMarket.strategy = this.selectedOrderStrategy._id;
                    updatedFieldCount++;
                }
            }

            if (this.placeAtBidWall != this.market.placeAtBidWall.toString()) {                
                updatedMarket.placeAtBidWall = this.parseAddMarketNumberFieldValue(this.placeAtBidWall);
                updatedFieldCount++;
            }

            if (this.placeAtSellWall != this.market.placeAtSellWall.toString()) {                
                updatedMarket.placeAtSellWall = this.parseAddMarketNumberFieldValue(this.placeAtSellWall);
                updatedFieldCount++;
            }
            
            if (this.ignoreOrderQtyLt != this.market.ignoreOrderQtyLt.toString()) {                
                updatedMarket.ignoreOrderQtyLt = this.parseAddMarketNumberFieldValue(this.ignoreOrderQtyLt);
                updatedFieldCount++;
            }

            if (this.maxBaseToSpend != this.market.maxBaseToSpend.toString()) {
                updatedMarket.maxBaseToSpend = this.parseAddMarketNumberFieldValue(this.maxBaseToSpend);
                updatedFieldCount++;
            }

            if (this.maxBidPrice != this.market.maxBidPrice.toString()) {
                updatedMarket.maxBidPrice = this.parseAddMarketNumberFieldValue(this.maxBidPrice);
                updatedFieldCount++;
            }

            if (this.maxDistFromNext != this.market.maxDistFromNext.toString()) {
                updatedMarket.maxDistFromNext = this.parseAddMarketNumberFieldValue(this.maxDistFromNext);
                updatedFieldCount++;
            }

            if (this.maxTokensToSell != this.market.maxTokensToSell.toString()) {
                updatedMarket.maxTokensToSell = this.parseAddMarketNumberFieldValue(this.maxTokensToSell);
                updatedFieldCount++;
            }

            if (this.minBaseToSpend != this.market.minBaseToSpend.toString()) {
                updatedMarket.minBaseToSpend = this.parseAddMarketNumberFieldValue(this.minBaseToSpend);
                updatedFieldCount++;
            }

            if (this.minSellPrice != this.market.minSellPrice.toString()) {
                updatedMarket.minSellPrice = this.parseAddMarketNumberFieldValue(this.minSellPrice);
                updatedFieldCount++;
            }

            if (this.minSpread != this.market.minSpread.toString()) {
                updatedMarket.minSpread = this.parseAddMarketNumberFieldValue(this.minSpread);
                updatedFieldCount++;
            }

            if (this.minTokensToSell != this.market.minTokensToSell.toString()) {
                updatedMarket.minTokensToSell = this.parseAddMarketNumberFieldValue(this.minTokensToSell);
                updatedFieldCount++;
            }

            if (this.priceIncrement != this.market.priceIncrement.toString()) {
                updatedMarket.priceIncrement = this.parseAddMarketNumberFieldValue(this.priceIncrement);
                updatedFieldCount++;
            }
            
            if (updatedFieldCount > 0) {
                const result = await this.mms.updateMarket(this.currentChainId, updatedMarket);

                if (result) {
                    this.loadMarketDetails();
                    this.loadUserDetails();
                }
            } else {
                const toastMessage = new ToastMessage();

                toastMessage.message = this.i18n.tr("marketMakerUpdateMarketNoChanges", {
                    symbol: this.selectedTokenSymbol,
                    ns: 'errors'
                });
                toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;
                this.toast.error(toastMessage);
            }
        }
        this.loading = false;
    }

    parseAddMarketNumberFieldValue(val) {
        if (val && !isNaN(val) && val.length > 0)
            return parseFloat(val);

        return null;
    }

    disableMarket() {
        this.dialogService
            .open({ viewModel: DisableMarketModal, model: this.market })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    enableMarket() {
        this.dialogService
            .open({ viewModel: EnableMarketModal, model: this.market })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    removeMarket(market) {
        this.dialogService
            .open({ viewModel: RemoveMarketModal, model: market })
            .whenClosed((x) => this.router.navigate("market-maker-dashboard"));
    }

    walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);

        // reload data if necessary
        if (!response.wasCancelled) {
            this.loadMarketDetails();
        }
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('selectedTokenSymbol')
            .required()
            .withMessageKey('errors:marketMakerAddMarketTokenRequired')
            .ensure('feeTokenUserBalance')
            .satisfies((value: any, object: any) => parseFloat(value) >= this.tokenOperationCost)
            .withMessageKey('errors:marketMakerUpdateMarketMoreStakeRequired')
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
            .ensure('placeAtBidWall')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketPlaceAtBidWallNaN')
            .ensure('placeAtSellWall')
            .satisfies((value: any, object: any) => value.length == 0 || !isNaN(value))
            .withMessageKey('errors:marketMakerAddMarketPlaceAtSellWallNaN')
            .rules;

        this.validationController.addObject(this, rules);
    }
}
