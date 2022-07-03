import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import styles from './dswap-order.module.css';
import { HiveEngineService } from 'services/hive-engine-service';
import { environment } from 'environment';
import { SwapService } from 'services/swap-service';
import { swapRequest } from 'common/dswap-api';
import { getPeggedTokenSymbolByChain, getSwapTokenByCrypto, getRandomID } from 'common/functions';
import { TokenService } from '../services/token-service';

@autoinject()
export class DswapOrderModal {
    @bindable amount;
    @bindable username;
    @bindable copyTxt = "Copy";
    @bindable copyMemoTxt = "Copy";

    private styles = styles;
    private loading = false;
    private subscription: Subscription;   
    private token: any;
    private validationController;
    private renderer;
    private swapRequestModel: ISwapRequestModel;
    private baseTokenSymbol;
    public storeSubscription: Subscription;
    private state: IState;
    private depositAddress;
    private sellToken;    
    private depositAmount: number;
    private customMemo;
    private customMemoId;
    private swapV2;

    constructor(private controller: DialogController, private toast: ToastService, private taskQueue: TaskQueue, private store: Store<IState>,
        private controllerFactory: ValidationControllerFactory, private i18n: I18N, private hes: HiveEngineService, private ss: SwapService, private ts: TokenService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;    

        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;
            }
        });    
    }

    bind() {
        this.createValidationRules();
    }

    async activate(swapRequestModel: ISwapRequestModel) {        
        this.swapRequestModel = swapRequestModel;
        this.baseTokenSymbol = await getPeggedTokenSymbolByChain(swapRequestModel.Chain);

        this.sellToken = this.state.tokens.find(x => x.symbol === swapRequestModel.TokenInput);
        if (this.sellToken && this.sellToken.isCrypto) {
            let sellTokenSwap = await getSwapTokenByCrypto(this.sellToken.symbol);
            if (sellTokenSwap == this.baseTokenSymbol) {
                this.depositAddress = environment.DSWAP_ACCOUNT_HE;
            } else {
                this.depositAddress = await this.hes.getDepositAddress(sellTokenSwap, environment.DSWAP_ACCOUNT_HE);
                
                if (this.depositAddress) {
                    this.swapRequestModel.TokenInputMemo = this.depositAddress.address;

                    if (this.depositAddress.memo) {
                        this.customMemoId = getRandomID();
                        this.customMemo = this.depositAddress.memo + " " + this.customMemoId;
                    }
                } else {
                    const toast = new ToastMessage();

                    toast.message = this.i18n.tr("converterApiTimeout", {
                        ns: 'errors'
                    });

                    this.toast.error(toast);
                }
            }

            // calculate 1.001% fee instead of 1% to be safe with rounding differences
            let amtInclFee = parseFloat((this.swapRequestModel.TokenInputAmount * 100 / 98.999).toFixed(8));

            this.depositAmount = amtInclFee;
        }
    }

    copyMessage(val: string, memo: boolean) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        if (memo) {
            this.copyMemoTxt = "Copied!";
        } else {
            this.copyTxt = "Copied!";
        }
    }

    balanceClicked() {
        this.amount = this.token.stake;
    }

    private createValidationRules() {
        
    }

    async confirmSend() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();

        this.loading = true;
        let customValid = true;

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

        if (this.sellToken && this.sellToken.isCrypto && !this.depositAddress) {
            const toast = new ToastMessage();

            toast.message = this.i18n.tr("DepositAddressMissing", {
                stake: this.token.stake,
                symbol: this.token.symbol,
                ns: 'errors'
            });

            this.toast.error(toast);
            customValid = false;
        }

        if (validationResult.valid && customValid) {
            //let waitMsg = this.i18n.tr('swapRequestQueued', {
            //    ns: 'notifications'
            //});

            if (this.swapRequestModel.TokenInputMemo)
            {
                this.swapV2 = false;
                let txMemo = this.swapRequestModel.TokenInputMemo;
                if (this.customMemo)
                    txMemo += " " + this.customMemo;

                this.swapRequestModel.ChainTransactionId = txMemo;

                // update token input memo with unique id generated (if it is applicable)
                if (this.customMemo)
                    this.swapRequestModel.TokenInputMemo = this.customMemoId;

                let swapResponse = await this.ss.SwapRequest(this.swapRequestModel);

                if (swapResponse && swapResponse.Id) {
                    this.controller.ok();
                }
            } else {
                var txMemoId = getRandomID();                
                this.swapRequestModel.TokenInputMemo = txMemoId;                
                let swapResponse = await this.ss.SwapRequest(this.swapRequestModel);
                this.swapV2 = true;

                var txMemo = "SwapRequest " + txMemoId;
                if (swapResponse && swapResponse.Id) {
                    var sendTx = await this.hes.sendToken(this.swapRequestModel.TokenInput, environment.DSWAP_ACCOUNT_HE, this.swapRequestModel.TokenInputAmount, txMemo);
                    if (sendTx) {
                        if (sendTx.transactionId) {
                            //this.swapRequestModel.ChainTransactionId = sendTx.transactionId;

                            await this.ts.enrichTokensWithUserBalances([this.swapRequestModel.TokenInput]);
                            this.controller.ok();
                        }
                    } else {
                        this.swapRequestModel.TokenInputMemo = "";
                    }
                }
            }
        }

        this.loading = false;
    }

}
