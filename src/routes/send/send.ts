import { TokenService } from 'services/token-service';
import { autoinject } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';
import { ToastService, ToastMessage } from 'services/toast-service';
import { ValidationControllerFactory, ValidationRules, ControllerValidateResult } from 'aurelia-validation';
import { I18N } from 'aurelia-i18n';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { getChainByState } from 'common/functions';
import { environment } from 'environment';
import { Chain } from '../../common/enums';
import { loadTokens } from '../../common/hive-engine-api';
import { HiveEngineService } from '../../services/hive-engine-service';
import { send } from 'process';

@autoinject()
export class Send {
    public storeSubscription: Subscription;
    public state: IState;
    public tokens: IToken[];
    public tokenSymbol;
    public token;
    private tokenAddress;
    private tokenAmount;
    private memo;
    private validationController;
    private renderer;
    private currentChainId;
    private dswapEnabled = false;

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<IState>,
        private toast: ToastService, 
        private controllerFactory: ValidationControllerFactory,
        private hes: HiveEngineService,
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

    async activate({ symbol }) {
        await this.refreshTokenLists();        
        this.refreshSelectPicker();
        await this.createValidationRules();
        this.currentChainId = await getChainByState(this.state);

        if (symbol) {
            this.tokenSymbol = symbol;            
            await this.tokenSelected();
        }
    }

    refreshSelectPicker() {
        $('.selectpicker').selectpicker("refresh");
    }

    async attached() {
        this.refreshSelectPicker();
        this.dswapEnabled = environment.dswapEnabled;
    }

    async setFullAmount() {
        this.tokenAmount = this.token.userBalance.balance;
    }

    async refreshTokenLists() {
        const symbols = environment.swapEnabledTokens;
        this.tokens = await loadTokens(symbols);
        await this.ts.enrichTokensWithMetrics(this.tokens, symbols, Chain.Hive);
    }
    
    async tokenSelected() {
        this.token = this.tokens.find(x => x.symbol == this.tokenSymbol);        
        if (!this.token.userBalance)
        {
            this.token.userBalance = await this.ts.getUserBalanceOfToken(this.tokenSymbol, this.currentChainId);
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
            let sendResult = await this.hes.sendToken(this.tokenSymbol, this.tokenAddress, this.tokenAmount, this.memo);
            
            if (sendResult) {
                const toast = new ToastMessage();

                if (sendResult.error) {
                    toast.message = this.i18n.tr("sendTransactionFailed", {
                        error: sendResult.error,
                        ns: 'errors'
                    });

                    this.toast.error(toast);
                } else {
                    toast.message = this.i18n.tr("sendTransactionSuccess", {
                        tokenSymbol: this.tokenSymbol,
                        tokenAmount: this.tokenAmount,
                        tokenAddress: this.tokenAddress,
                        ns: 'notifications'
                    });

                    this.toast.success(toast);

                    // update user balance & clear values
                    this.token.userBalance = await this.ts.getUserBalanceOfToken(this.tokenSymbol, this.currentChainId);
                    this.tokenAmount = "";
                    this.tokenAddress = "";
                    this.memo = "";
                }
            }
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
