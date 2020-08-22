import { Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { autoinject } from 'aurelia-framework';
import { Router, Redirect } from 'aurelia-router';
import { MarketMakerService } from "services/market-maker-service";
import { Chain } from "common/enums";
import { HiveEngineService } from "services/hive-engine-service";
import { TokenService } from "services/token-service";
import { environment } from 'environment';
import { ValidationControllerFactory, ValidationRules, ControllerValidateResult } from "aurelia-validation";
import { BootstrapFormRenderer } from "resources/bootstrap-form-renderer";
import { ToastMessage, ToastService } from "services/toast-service";
import { I18N } from "aurelia-i18n";

@autoinject()
export class RegisterMarketMaker {
    // private styles = styles;
    public subscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;
    private marketMakerUser;
    private termsAccepted = true;
    private loading = false;
    private tokenSymbol = "BEE";
    private tokenUserBalance = 0;
    private tokenOperationCost;
    private validationController;
    private renderer;

    constructor(private marketMakerService: MarketMakerService,
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

                if (this.marketMakerUser && this.marketMakerUser._id && this.marketMakerUser._id > 0) {
                    this.router.navigate('market-maker-dashboard');
                }
            }
        });
    }

    async bind() {
        this.createValidationRules();

        this.tokenOperationCost = environment.marketMakerRegistrationCost;

        if (this.user) {
            let balance = await this.ts.getUserBalanceOfToken(this.tokenSymbol);
            if (balance)
                this.tokenUserBalance = balance.balance;
        }        
    }

    async registerClick() {
        console.log('register');
        if (this.termsAccepted) {
            const validationResult: ControllerValidateResult = await this.validationController.validate();

            for (const result of validationResult.results) {
                if (!result.valid) {
                    const toast = new ToastMessage();

                    toast.message = this.i18n.tr(result.rule.messageKey, {
                        symbol: this.tokenSymbol,
                        tokenUserBalance: this.tokenUserBalance,
                        tokenOperationCost: this.tokenOperationCost,
                        ns: 'errors'
                    });

                    this.toast.error(toast);
                }
            }

            if (validationResult.valid) {
                this.loading = true;
                await this.marketMakerService.register(Chain.Hive);
                this.loading = false;

                //this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
                //    console.log(response);
                //});
            }

            
        } else {
            this.router.navigate("market-maker");
        }
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('tokenUserBalance')
            .required()
            .withMessageKey("errors:marketMakerRegisterTokenUserBalanceRequired")
            .then()
            .satisfies((value: any, object: any) => this.tokenOperationCost <= this.tokenUserBalance)
            .withMessageKey('errors:marketMakerRegisterInsufficientBalance')
            .rules;

        this.validationController.addObject(this, rules);
    }

}
