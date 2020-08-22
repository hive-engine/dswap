import { dispatchify, Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { DialogController } from "aurelia-dialog";
import { autoinject, TaskQueue, bindable } from "aurelia-framework";
import { MarketMakerService } from "services/market-maker-service";
import { TokenService } from "services/token-service";
import { ToastService } from "services/toast-service";
import { I18N } from "aurelia-i18n";
import { ValidationControllerFactory } from "aurelia-validation";
import { Router, Redirect } from 'aurelia-router';
import { BootstrapFormRenderer } from "resources/bootstrap-form-renderer";
import { environment } from 'environment';
import { Chain } from "common/enums";

@autoinject()
export class AddMarketModal {
    public subscription: Subscription;
    private state: IState;
    private tokenSymbol = "BEE";
    private tokenUserStake = 0;
    private tokenOperationCost;
    private validationController;
    private renderer;
    private user;
    private marketMakerUser;
    private mmTokens;
    private selectedTokenSymbol;
    private selectedToken;
    private loading = false;
    private market: IMarketMakerMarket;
    private isEnabled = false;

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
                    this.router.navigate('market-maker-dashboard');
                }
            }
        });
    }

    async bind() {
        this.mmTokens = await this.ts.getMarketMakerTokens();
        this.tokenOperationCost = environment.marketMakerStakeRequiredPerMarket;

        if (this.user) {
            let balance = await this.ts.getUserBalanceOfToken(this.tokenSymbol);            
            if (balance)
                this.tokenUserStake = parseFloat(balance.stake);
        }        
    }

    tokenSelected() {
        this.selectedTokenSymbol = this.selectedToken.symbol;
    }

    async confirmAddMarket() {
        this.loading = true;
        this.market = {
            symbol: this.selectedTokenSymbol,
            isEnabled: this.isEnabled
        };

        const result = await this.mms.addMarket(Chain.Hive, this.market);

        if (result) {
            this.controller.ok();
        }

        this.loading = false;
    }
}
