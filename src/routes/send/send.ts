import { TokenService } from 'services/token-service';
import { autoinject } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';
import { ToastService, ToastMessage } from 'services/toast-service';
import { ValidationControllerFactory, ValidationRules, ControllerValidateResult } from 'aurelia-validation';
import { I18N } from 'aurelia-i18n';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';

@autoinject()
export class Send {
    public storeSubscription: Subscription;
    public state: IState;
    public tokens: IToken[];
    public tokenSymbol;
    public token;
    private tokenAddress;
    private tokenAmount;
    private validationController;
    private renderer;

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<IState>,
        private toast: ToastService, 
        private controllerFactory: ValidationControllerFactory, 
        private i18n: I18N
    ) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;
            }
        });
    }

    async bind() {
        await this.refreshTokenLists();        
        this.refreshSelectPicker();
        await this.createValidationRules();
    }

    refreshSelectPicker() {
        $('.selectpicker').selectpicker("refresh");
    }

    async attached() {
        this.refreshSelectPicker();
    }

    async setFullAmount() {
        this.tokenAmount = this.token.userBalance.balance;
    }

    async refreshTokenLists() {
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.tokens = [...this.state.tokens];        
    }
    
    async tokenSelected() {
        this.token = this.tokens.find(x => x.symbol == this.tokenSymbol);
        if (!this.token.userBalance)
        {
            this.token.userBalance = await this.ts.getUserBalanceOfToken(this.token);
        }
    }

    async sendTokens() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();
        
        for (const result of validationResult.results) {            
            if (!result.valid) {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr(result.rule.messageKey, {
                    tokenSymbol: this.tokenSymbol,
                    tokenAmount: this.tokenAmount,
                    tokenAddress: this.tokenAddress,
                    tokenBalance: this.token.userBalance != null ? this.token.userBalance.balance : "",
                    ns: 'errors' 
                });
                
                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {
            console.log('valid');
        }
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('tokenSymbol')
                .required()
                    .withMessageKey('errors:sendTokenSymbolRequired')
            .ensure('tokenAddress')
                    .required()
                        .withMessageKey('errors:sendTokenAddressRequired')
            .ensure('tokenAmount')
                    .required()
                        .withMessageKey("errors:sendTokenAmountRequired")
                    .then()
                    .satisfies((value: any, object: any) => parseFloat(value) > 0)
                    .withMessageKey('errors:sendTokenAmountMustBeGreaterThanZero')
                    .satisfies((value: any, object: any) => parseFloat(value) <= this.token.userBalance.balance)
                    .withMessageKey('errors:sendTokenInsufficientBalance')
        .rules;

        this.validationController.addObject(this, rules);
    }
}
