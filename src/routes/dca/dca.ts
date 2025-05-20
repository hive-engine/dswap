import { Redirect } from 'aurelia-router';
import { ToFixedValueConverter } from 'resources/value-converters/to-fixed';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable, TaskQueue } from 'aurelia-framework';
import { DswapOrderDcaModal } from 'modals/dswap-order-dca';
import { DialogService } from 'aurelia-dialog';
import { Store, dispatchify } from 'aurelia-store';
import { ChartComponent } from 'components/chart/chart';
import { loadTokenMarketHistory, loadBuyBook, loadSellBook, loadTokens } from 'common/hive-engine-api';
import moment from 'moment';
import { getPrices, usdFormat, getChainByState, getPeggedTokenSymbolByChain, getSwapTokenByCrypto, getPeggedTokenPriceByChain, isNumeric, getSwapStatusById, getNextOrderDateTime } from 'common/functions';
import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { TokenService } from 'services/token-service';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { environment } from 'environment';
import { Chain, DCAType, SwapStatus } from 'common/enums';
import { SwapService } from 'services/swap-service';
import { env } from 'process';
import { getDCACancelRequests, getSwapDCADetail, getSwapDCARequests } from 'common/dswap-api';
import { DswapSwapdetailsModal } from 'modals/dswap-swapdetails';
import { DswapOrderDcaCancelModal } from 'modals/dswap-order-dca-cancel';

@autoinject()
@customElement('dca')
export class DCA {
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
    @bindable() loading = false;
    @bindable() loadingDCA = false;
    
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
    private recurrenceTypeValue;
    @bindable() dcaRecurrenceTypeAmount = 1;
    @bindable() dcaOrderNo = 2;
    private recurrenceTypeValues: string[] = ["minute", "hour", "day", "week", "month" ];
    private dcaSellPerOrder;
    private dswapDcaFee;
    @bindable() dcaTradesActive: ISwapRequestDCAViewModel[];
    @bindable() dcaTradesHistory: ISwapRequestDCAViewModel[];
    @bindable() dcaDetail: ISwapRequestDCADetailViewModel;
    @bindable() timeUntilNextOrder;

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

            this.state.activePageId = "dca";
            this.currentChainId = await getChainByState(this.state);            
        } catch {
            return new Redirect('');
        }
    }

    async refreshSelectPicker() {
        this.taskQueue.queueTask({
            call: () => $('.selectpicker').selectpicker("refresh")
        });        
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
    
    async attached() {
        this.refreshSelectPicker();
        this.dswapEnabled = environment.dswapEnabled;
        this.dswapPaused = environment.dswapPaused;
        this.dswapDcaFee = environment.dswapDcaFee + '%';
        this.dcaTradesActive = await this.getActiveDCARequests();
        this.dcaTradesHistory = await this.getHistoricalDCARequests();
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
                    dcaTradeValueUsd: this.sellToken != null && this.sellToken.metrics != null ? parseFloat(this.sellToken.metrics.lastPriceUsd) * this.sellTokenAmount : "",
                    ns: 'errors' 
                });
                
                this.toast.error(toast);
            }
        }

        if (validationResult.valid) {
            let swapRequestDcaModel: ISwapRequestDCAModel = {
                Account: this.state.account.name,
                Chain: Chain.Hive,
                ChainTransactionId: "",
                TokenOutput: this.buyTokenSymbol,
                TokenInput: this.sellTokenSymbol,
                TokenInputAmount: this.sellTokenAmount,
                SwapSourceId: environment.DSWAP_SOURCE_ID,
                TokenInputMemo: "",
                RecurrenceType: this.recurrenceTypeValue,
                RecurrenceTypeAmount: this.dcaRecurrenceTypeAmount,
                OrderCount: this.dcaOrderNo,
                DCAType: DCAType.MarketDCA,
                PoolTokenPair: ""
            };                        

            this.loading = true;
            this.dialogService.open({ viewModel: DswapOrderDcaModal, model: swapRequestDcaModel }).whenClosed(response => {                
                this.loading = false;
                if (!response.wasCancelled) {
                    this.loadDcaActive();                    
                }
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

    async recurrenceTypeSelected(){

    }

    async sellTokenAmountChanged() {
        this.updateDcaSummary();
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

        if (!this.buyToken.metrics) {
            await this.ts.enrichTokensWithMetrics([this.buyToken], [this.buyToken.symbol], Chain.Hive);
        }

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

            await this.updateTradeValueUsd();
        }
    }

    async dcaRecurrenceTypeAmountChanged(){
        this.updateDcaSummary();
    }

    async dcaOrderNoChanged() {
        this.updateDcaSummary();
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

        if (!this.sellToken.metrics) {
            await this.ts.enrichTokensWithMetrics([this.sellToken], [this.sellToken.symbol], Chain.Hive);
        }

        //console.log(this.sellToken);
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

    async getTokenSymbolToCheck(tokenSymbol) {
        let tokenSymbolToCheck = tokenSymbol;
        let tokenToCheck = this.state.tokens.find(x => x.symbol == tokenSymbol);
        if (tokenToCheck && tokenToCheck.isCrypto)
            tokenSymbolToCheck = getSwapTokenByCrypto(tokenSymbol);

        return tokenSymbolToCheck;
    }

    updateDcaSummary() {
        this.dcaSellPerOrder = this.sellTokenAmount / this.dcaOrderNo;
    }

    // DCA overview & history
    async getActiveDCARequests(){               
        this.loadingDCA = true;
        let tradesActive = await getSwapDCARequests(this.state.account.name, 100, 0, DCAType.MarketDCA, [SwapStatus.Init, SwapStatus.InProgress]);
        for (let t of tradesActive) {
            t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
            t.timestamp_day = moment(t.CreatedAt).format('DD');
            t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
            t.timestamp_year = moment(t.CreatedAt).format('YYYY');
            t.SwapStatusName = await getSwapStatusById(t.SwapStatusId);
        }

        let dcaCancelRequests = await getDCACancelRequests(this.state.account.name, SwapStatus.Init);
        for (let t of tradesActive) {
            for (let d of dcaCancelRequests) {
                if (t.Id == d.DCAId) {
                    t.CancelRequested = true;
                }
            }
        }

        this.loadingDCA = false;
        
        return tradesActive;
    }

    async refreshDcaOverview(){
        this.loadingDCA = true;
        await this.loadDCARequests();
        this.loadingDCA = false;
    }

    async getHistoricalDCARequests(){
        this.loadingDCA = true;
        let tradesHistory = await getSwapDCARequests(this.state.account.name, 100, 0, DCAType.MarketDCA, [SwapStatus.Success, SwapStatus.Failure, SwapStatus.SuccessPartial, SwapStatus.Cancelled, SwapStatus.Expired]);
        for (let t of tradesHistory) {
            t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
            t.timestamp_day = moment(t.CreatedAt).format('DD');
            t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
            t.timestamp_year = moment(t.CreatedAt).format('YYYY');
            t.SwapStatusName = await getSwapStatusById(t.SwapStatusId);
        }
        
        this.loadingDCA = false;
        return this.sortByStartDate(tradesHistory);
    }

    async loadDcaData(dcaId) {
        let dcaDetail = await getSwapDCADetail(dcaId);
        dcaDetail.SwapRequestDCA.LastOrderDateTime = dcaDetail.SwapRequestDCA.CreatedAt;

        if (dcaDetail.SwapRequests){
            let i = 0;

            for (let t of dcaDetail.SwapRequests) {
                if (i == 0)
                    dcaDetail.SwapRequestDCA.LastOrderDateTime = t.CreatedAt;

                t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
                t.timestamp_day = moment(t.CreatedAt).format('DD');
                t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
                t.timestamp_year = moment(t.CreatedAt).format('YYYY');
                t.SwapStatusName = await getSwapStatusById(t.SwapStatusId);

                i++;
            }            
        }

        if (dcaDetail.DCARefunds) {
            for (let t of dcaDetail.DCARefunds) {
                t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
                t.timestamp_day = moment(t.CreatedAt).format('DD');
                t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
                t.timestamp_year = moment(t.CreatedAt).format('YYYY');
                t.SwapStatusName = await getSwapStatusById(t.SwapStatusId);
            }            
        }
        this.dcaDetail = dcaDetail;  

        this.timeUntilNextOrder = getNextOrderDateTime(this.dcaDetail);
        
        this.activateDcaButton('details'+dcaId);
    }

    viewSwapDetails(trade) {
            this.dialogService.open({ viewModel: DswapSwapdetailsModal, model: trade }).whenClosed(response => {
                console.log(response);
            });
        }

    activateDcaButton(button) {
        $(".btn-dca").removeClass("active");
        $("#btn-dca-"+button).addClass("active");
    }

    dcaCancel(trade) {
        this.dialogService.open({ viewModel: DswapOrderDcaCancelModal, model: trade }).whenClosed(response => {
            console.log(response);
            if (!response.wasCancelled) {
                this.loadDCARequests();
            }
        });
    }

    async loadDcaActive() {
        this.dcaTradesActive = await this.getActiveDCARequests();
    }

    async loadDcaHistory() {
        this.dcaTradesHistory = await this.getHistoricalDCARequests();
    }

    async loadDCARequests(){
        this.dcaTradesActive = await this.getActiveDCARequests();
        this.dcaTradesHistory = await this.getHistoricalDCARequests();
    }

    async refreshMyBalances(){
        this.loading = true;
        await this.ts.getDSwapTokenBalances(Chain.Hive, true);
        this.loading = false;
    }

    private getTime(date?: Date) {
        return date != null ? new Date(date).getTime() : 0;
      }
    
      public sortByStartDate(array: ISwapRequestDCAViewModel[]): ISwapRequestDCAViewModel[] {
        return array.sort((a: ISwapRequestDCAViewModel, b: ISwapRequestDCAViewModel) => {
            let aDate:Date = moment(a.CreatedAt,"YYYY-MM-DD HH:mm").toDate();//.format("YYYY-MM-DD HH:mm");
            let bDate:Date = moment(b.CreatedAt,"YYYY-MM-DD HH:mm").toDate();//.format("YYYY-MM-DD HH:mm");
          return this.getTime(bDate) - this.getTime(aDate);
        });
      }

    private createValidationRules() {
        const rules = ValidationRules
            .ensure('buyTokenSymbol')
                .required()
                    .withMessageKey('errors:dashboardBuyTokenSymbolRequired')
            .ensure('sellTokenSymbol')
                    .required()
                        .withMessageKey('errors:dashboardSellTokenSymbolRequired')            
            .ensure('sellTokenAmount')
                    .required()
                        .withMessageKey("errors:dashboardSellTokenAmountRequired")
                    .then()
            .ensure('sellTokenAmount').satisfies((value: any, object: any) => parseFloat(value) > 0)
                    .withMessageKey('errors:dashboardAmountMustBeGreaterThanZero')
            .ensure('dcaRecurrenceTypeAmount')
                    .required()
                        .withMessageKey("errors:dcaRecurrenceTypeAmountRequired")
                    .then()
            .ensure('dcaRecurrenceTypeAmount').satisfies((value: any, object: any) => {                         
                        if (parseFloat(value) > 0) 
                            return true; 

                        return false;
                    })
                    .withMessageKey('errors:dcaRecurrenceTypeAmountRanges')            
            .ensure('dcaOrderNo')
                    .required()
                        .withMessageKey("errors:dcaOrderNoRequired")
                    .then()
            .ensure('dcaOrderNo').satisfies((value: any, object: any) => {
                        if (parseFloat(value) >= 2 && parseFloat(value) <= 20){
                            return true;
                        }

                        return false;
                    }).withMessageKey('errors:dcaOrderNoRanges').then()               
            .satisfies((value: any, object: any) => {
                if (this.sellToken.isCrypto || parseFloat(this.sellTokenAmount) <= this.sellToken.userBalance.balance){ 
                    return true;
                }

                return false;
            }).withMessageKey('errors:dashboardInsufficientBalance')
            .then()
            .satisfies((value: any, object: any) => {
                if(parseFloat(this.sellToken.metrics.lastPriceUsd) * this.sellTokenAmount >= 1) {
                    return true;
                };

                return false;
            }).withMessageKey('errors:dcaMinimumOrderValueUsd')
        .rules;

        this.validationController.addObject(this, rules);
    }
}


