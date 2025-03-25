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
import { env } from 'process';
import { Chain, SwapStatus } from 'common/enums';

@autoinject()
export class DswapOrderDcaCancelModal {
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
    private swapRequestModel: ISwapRequestDCAViewModel;
    private baseTokenSymbol;
    public storeSubscription: Subscription;
    private state: IState;
    private depositAddress;
    private sellToken;    
    private depositAmount: number;
    private customMemo;
    private customMemoId;
    private swapV2;
    private dswapDcaFee;
    private dswapDcaCancelFee;

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
        this.dswapDcaFee = environment.dswapDcaFee + '%';
        this.dswapDcaCancelFee = environment.dswapDcaCancelFee + " " + environment.peggedToken;
    }

    async activate(swapRequestModel: ISwapRequestDCAViewModel) {                
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

    balanceClicked() {
        this.amount = this.token.stake;
    }

    private createValidationRules() {
        
    }

    tokenImage(symbol) {
        if (symbol == environment.marketMakerFeeToken) {
            return environment.EXCHANGE_URL_HE + 'images/logo-small.png';
        } else {
            var t = this.state.tokens.find(x => x.symbol === symbol);
            if (t) {
                return t.metadata.icon.endsWith('.svg') ? t.metadata.icon : `https://images.hive.blog/0x0/${t.metadata.icon}`;
            }
        }
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

        if (this.swapRequestModel.SwapStatusId != SwapStatus.InProgress &&
            this.swapRequestModel.SwapStatusId != SwapStatus.CancelRequested &&
            this.swapRequestModel.SwapStatusId != SwapStatus.Init
        ) {
            customValid = false;

            const toast = new ToastMessage();            
            toast.message = this.i18n.tr("dcaCancelErrorUnsupportedStatus", {
                error: '',
                ns: 'errors'
            });

            this.toast.error(toast);
        }

        if (this.swapRequestModel.Account != this.state.account.name) {
            customValid = false;

            const toast = new ToastMessage();            
            toast.message = this.i18n.tr("dcaCancelErrorUsernameMismatch", {
                error: '',
                ns: 'errors'
            });

            this.toast.error(toast);
        }

        if (validationResult.valid && customValid) {
            //let waitMsg = this.i18n.tr('swapRequestQueued', {
            //    ns: 'notifications'
            //});
            var txMemoId = getRandomID();                

             let dcaCancelRequestModel: IDCACancelRequestModel = {
                            Account: this.state.account.name,
                            Chain: Chain.Hive,
                            ChainTransactionId: "",
                            DCAId: this.swapRequestModel.Id,
                            SourceId: environment.DSWAP_SOURCE_ID,
                            TokenInputMemo: txMemoId,
                            Message: ""
                        };            

            let dcaCancelResponse = await this.ss.CancelSwapRequestDCA(dcaCancelRequestModel);
            this.swapV2 = true;

            var txMemo = "SwapRequestDCA Cancel " + txMemoId;
            if (dcaCancelResponse && dcaCancelResponse.Id) {
                var sendTx = await this.hes.sendToken(environment.peggedToken, environment.DSWAP_ACCOUNT_HE, environment.dswapDcaCancelFee, txMemo, '', 'tokensSentDca');
                if (sendTx) {
                    if (sendTx.transactionId) {
                        //this.swapRequestModel.ChainTransactionId = sendTx.transactionId;

                        //await this.ts.enrichTokensWithUserBalances([this.swapRequestModel.TokenInput]);
                        this.ts.getDSwapTokenBalances(Chain.Hive, true);
                        this.controller.ok();
                    }
                } else {
                    this.swapRequestModel.TokenInputMemo = "";
                }
            }
        }

        this.loading = false;
    }

}
