import { Redirect } from 'aurelia-router';
import { ToFixedValueConverter } from 'resources/value-converters/to-fixed';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable, TaskQueue } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { Store, dispatchify } from 'aurelia-store';
import { ChartComponent } from 'components/chart/chart';
import { loadTokenMarketHistory, loadBuyBook, loadSellBook } from 'common/hive-engine-api';
import moment from 'moment';
import { getPrices, usdFormat, getChainByState, getPeggedTokenSymbolByChain, getSwapTokenByCrypto, getPeggedTokenPriceByChain, isNumeric } from 'common/functions';
import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { TokenService } from 'services/token-service';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { environment } from 'environment';
import { Chain } from 'common/enums';
import { SwapService } from 'services/swap-service';

@autoinject()
@customElement('dashboard')
export class Dashboard {
    public storeSubscription: Subscription;
    public state: IState;
    public buyTokens: IToken[];
    @bindable() sellTokens: IToken[];
    public buyTokenSymbol;
    public sellTokenSymbol;
    @bindable() sellTokenAmount;
    @bindable() buyTokenAmount;
    public buyToken : IToken;
    public sellToken : IToken;
    private unitEstimateRate;
    private tradeValueUsd;
    private loggedIn;
    @bindable() tradePercentage;
    @bindable loading = false;
    
    private chartRefBuy: ChartComponent;
    private chartRefSell: ChartComponent;

    private chartDataBuy: any = {};
    private chartDataSell: any = {};
    private user;
    private validationController;
    private renderer;    
    private dswapEnabled = false;
    private dswapPaused = false;
    private currentChainId;
    private baseTokenSymbol;
    private baseTokenAmount;
    private maxSlippageInputToken = 5.00;
    private maxSlippageOutputToken = 5.00;

    constructor(private dialogService: DialogService, 
                private ts: TokenService, 
                private store: Store<IState>, 
                private toast: ToastService, 
                private controllerFactory: ValidationControllerFactory, 
                private i18n: I18N,
                private taskQueue: TaskQueue,
                private ss: SwapService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;
                
                this.user = { ...state.firebaseUser };
                this.loggedIn = state.loggedIn;
            }
          });       
    }

    async canActivate({ symbol, transactionType }) {        
        try {
            if (!this.state.tokens) {
                await this.ts.getDSwapTokens(true, Chain.Hive);
            }
            await dispatchify(getCurrentFirebaseUser)();
            await dispatchify(getMarketMakerUser)();

            this.refreshTokenLists();
            this.createValidationRules();

            if (symbol && transactionType) {
                if (transactionType === "buy") {
                    this.buyTokenSymbol = symbol;
                    await this.buyTokenSelected();
                } else if (transactionType === "sell") {
                    this.sellTokenSymbol = symbol;
                    await this.sellTokenSelected();
                }
            }

            this.state.activePageId = "dashboard";
            this.currentChainId = await getChainByState(this.state);
            this.baseTokenSymbol = await getPeggedTokenSymbolByChain(this.currentChainId);
        } catch {
            return new Redirect('');
        }
    }

    async refreshSelectPicker() {
        this.taskQueue.queueTask({
            call: () => $('.selectpicker').selectpicker("refresh")
        });        
    }
    
    async attached() {
        this.refreshSelectPicker();
        this.dswapEnabled = environment.dswapEnabled;
        this.dswapPaused = environment.dswapPaused;
    }

    async startTrade() {
        const validationResult: ControllerValidateResult = await this.validationController.validate();
        
        for (const result of validationResult.results) {            
            if (!result.valid) {
                const toast = new ToastMessage();

                toast.message = this.i18n.tr(result.rule.messageKey, {
                    buyTokenSymbol: this.buyTokenSymbol,
                    sellTokenSymbol: this.sellTokenSymbol,
                    buyTokenAmount: this.buyTokenAmount,
                    sellTokenAmount: this.sellTokenAmount,
                    sellTokenBalance: this.sellToken != null ? this.sellToken.userBalance.balance : "",
                    ns: 'errors' 
                });
                
                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {
            let swapRequestModel: ISwapRequestModel = {
                Account: this.state.account.name,
                Chain: Chain.Hive,
                ChainTransactionId: "",
                TokenOutput: this.buyTokenSymbol,
                TokenOutputAmount: this.buyTokenAmount,
                TokenInput: this.sellTokenSymbol,
                TokenInputAmount: this.sellTokenAmount,
                SwapSourceId: environment.DSWAP_SOURCE_ID,
                BaseTokenAmount: this.baseTokenAmount,
                MaxSlippageInputToken: this.maxSlippageInputToken,
                MaxSlippageOutputToken: this.maxSlippageOutputToken,
                TokenInputMemo: ""
            };            

            this.loading = true;
            this.dialogService.open({ viewModel: DswapOrderModal, model: swapRequestModel }).whenClosed(response => {
                console.log(response);
                this.loading = false;
            });
        }
    }

    async refreshTokenLists(){
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens(true, Chain.Hive);
        }

        this.buyTokens = [...this.state.tokens];
        this.sellTokens = [...this.state.tokens];

        // filter out crypto from buy token list for now
        // filter out 0 precision tokens to prevent loss
        this.buyTokens = this.buyTokens.filter(x => !x.isCrypto && x.precision != 0);
        this.sellTokens = this.sellTokens.filter(x => x.precision != 0);
        
        if (this.buyToken)
            this.sellTokens.splice(this.sellTokens.indexOf(this.sellTokens.find(x => x.symbol == this.buyToken.symbol)), 1);

        if (this.sellToken)
            this.buyTokens.splice(this.buyTokens.indexOf(this.buyTokens.find(x => x.symbol == this.sellToken.symbol)), 1);

        await this.refreshSelectPicker();
    }

    async calcUnitEstimateRate() {
        if (this.buyToken && this.sellToken) {
            //this.unitEstimateRate = (this.buyToken.metrics.lastPrice / this.sellToken.metrics.lastPrice).toFixed(8);

            //await this.updateTradeValueUsd();            
        }
    }

    async buyTokenSelected() {        
        if (this.chartRefBuy)
            this.chartRefBuy.detached();

        this.chartDataBuy = await this.loadTokenHistoryData(this.buyTokenSymbol);

        if (this.chartRefBuy)
            this.chartRefBuy.attached();
        
        this.buyToken = this.state.tokens.find(x => x.symbol == this.buyTokenSymbol);
        this.fillPeggedTokenMetrics(this.buyToken);
        this.refreshTokenLists();

        if (!this.buyToken.userBalance)
            await this.getTokenBalance(this.buyToken);

        if (this.buyTokenAmount && this.buyTokenAmount > 0)
            this.buyTokenAmount = 0;
        
        await this.calcUnitEstimateRate();  
    }

    async getTokenBalance(token) {                
        if (!token || !token.loadUserBalances) {
            await this.ts.getDSwapTokenBalances(Chain.Hive);
        } 
    }

    async tradePercentageChanged(){
        if (this.buyToken && this.sellToken) {
            this.sellTokenAmount = (this.tradePercentage / 100) * this.sellToken.userBalance.balance;
            this.buyTokenAmount = (this.sellTokenAmount / this.unitEstimateRate).toFixed(8);

            await this.updateTradeValueUsd();
        }
    }

    async updateTradeValueUsd() {
        if (this.sellToken.metrics)
            this.tradeValueUsd = (this.sellTokenAmount * parseFloat(this.sellToken.metrics.lastPriceUsd)).toFixed(4);
    }

    async fillPeggedTokenMetrics(token) {
        let symbolToCheck = await this.getTokenSymbolToCheck(token.symbol);
        if (symbolToCheck == this.baseTokenSymbol) {
            let peggedTokenPrice = await getPeggedTokenPriceByChain(this.currentChainId);
            token.metrics = { lastPriceUsd: peggedTokenPrice, lastPrice: peggedTokenPrice };
        }
    }

    async sellTokenSelected() {
        if (this.chartRefSell)
            this.chartRefSell.detached();

        this.chartDataSell = await this.loadTokenHistoryData(this.sellTokenSymbol);

        if (this.chartRefSell)
            this.chartRefSell.attached();
        
        this.sellToken = this.state.tokens.find(x => x.symbol == this.sellTokenSymbol);
        this.fillPeggedTokenMetrics(this.sellToken);
        this.refreshTokenLists();

        if (!this.sellToken.userBalance)
            await this.getTokenBalance(this.sellToken);

        if (this.sellTokenAmount && this.sellTokenAmount > 0)
            this.sellTokenAmount = 0;

        await this.calcUnitEstimateRate();      
    }

    async slideTo(percentage) {
        this.tradePercentage = percentage;
    }

    async loadTokenHistoryData(token) {
        const tokenHistory = await loadTokenMarketHistory(token);
        const limitCandleStick = 30; // show last 30 days

        const candleStickData = tokenHistory.slice(0, limitCandleStick).map(x => {
            return {
                t: moment.unix(x.timestamp).format('YYYY-MM-DD HH:mm:ss'), //x.timestamp * 1000,
                o: x.openPrice,
                h: x.highestPrice,
                l: x.lowestPrice,
                c: x.closePrice,
            };
        });

        return { ohlcData: candleStickData };
    }

    public toFixed(num, fixed) {
        var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    public async sellTokenAmountInViewChanged(event) {
        this.loading = true;
        if (this.sellToken) {
            if (isNumeric(this.sellTokenAmount)) {
                let swapCalcRequestModel: ISwapCalcValuesModel = {
                    Chain: Chain.Hive,
                    TokenInput: this.sellTokenSymbol,
                    TokenInputAmount: this.sellTokenAmount,
                    TokenOutput: this.buyTokenSymbol
                };

                let swapCalcResponse = await this.ss.CalculateSwapOutput(swapCalcRequestModel);
                if (swapCalcResponse) {
                    this.baseTokenAmount = swapCalcResponse.BaseTokenAmount;
                    this.buyTokenAmount = this.toFixed(swapCalcResponse.TokenOutputAmount, this.buyToken.precision);
                }

                await this.updateTradeValueUsd();
            } else {
                this.buyTokenAmount = "Not a number";
            }
        }
        this.loading = false;
    }

    public async buyTokenAmountInViewChanged(event) {
        this.loading = true;
        if (this.buyToken) {
            if (isNumeric(this.buyTokenAmount)) {
                let swapCalcRequestModel: ISwapCalcValuesModel = {
                    Chain: Chain.Hive,
                    TokenInput: this.sellTokenSymbol,
                    TokenOutput: this.buyTokenSymbol,
                    TokenOutputAmount: this.buyTokenAmount
                };

                let swapCalcResponse = await this.ss.CalculateSwapInput(swapCalcRequestModel);
                if (swapCalcResponse) {
                    this.baseTokenAmount = swapCalcResponse.BaseTokenAmount;
                    this.sellTokenAmount = swapCalcResponse.TokenInputAmount.toFixed(this.sellToken.precision);
                }

                await this.updateTradeValueUsd();
            } else {
                this.sellTokenAmount = "Not a number";
            }
        }
        this.loading = false;
    }

    async getTokenSymbolToCheck(tokenSymbol) {
        let tokenSymbolToCheck = tokenSymbol;
        let tokenToCheck = this.state.tokens.find(x => x.symbol == tokenSymbol);
        if (tokenToCheck && tokenToCheck.isCrypto)
            tokenSymbolToCheck = getSwapTokenByCrypto(tokenSymbol);

        return tokenSymbolToCheck;
    }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('buyTokenSymbol')
                .required()
                    .withMessageKey('errors:dashboardBuyTokenSymbolRequired')
            .ensure('sellTokenSymbol')
                    .required()
                        .withMessageKey('errors:dashboardSellTokenSymbolRequired')
            .ensure('buyTokenAmount')
                .required()
                    .withMessageKey("errors:dashboardBuyTokenAmountRequired")
                .then()
                    .satisfies((value: any, object: any) => parseFloat(value) > 0)
                    .withMessageKey('errors:dashboardAmountMustBeGreaterThanZero')
            .ensure('sellTokenAmount')
                    .required()
                        .withMessageKey("errors:dashboardSellTokenAmountRequired")
                    .then()
                    .satisfies((value: any, object: any) => parseFloat(value) > 0)
            .withMessageKey('errors:dashboardAmountMustBeGreaterThanZero')
            .satisfies((value: any, object: any) => this.sellToken.isCrypto || parseFloat(value) <= this.sellToken.userBalance.balance)
                    .withMessageKey('errors:dashboardInsufficientBalance')
        .rules;

        this.validationController.addObject(this, rules);
    }
}
