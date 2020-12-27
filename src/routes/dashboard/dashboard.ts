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
import { getPrices, usdFormat, getChainByState, getPeggedTokenSymbolByChain } from 'common/functions';
import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { TokenService } from 'services/token-service';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { environment } from 'environment';
import { Chain } from 'common/enums';

@autoinject()
@customElement('dashboard')
export class Dashboard {
    public storeSubscription: Subscription;
    public state: IState;
    public buyTokens: IToken[];
    @bindable() sellTokens: IToken[];
    public buyTokenSymbol;
    public sellTokenSymbol;
    public sellTokenAmount;
    public buyTokenAmount;
    public buyToken : IToken;
    public sellToken : IToken;
    private unitEstimateRate;
    private tradeValueUsd;
    private loggedIn;
    @bindable() tradePercentage;
    
    private chartRefBuy: ChartComponent;
    private chartRefSell: ChartComponent;

    private chartDataBuy: any = {};
    private chartDataSell: any = {};
    private user;
    private validationController;
    private renderer;    
    private dswapEnabled = false;
    private currentChainId;
    private baseTokenSymbol;
    private baseTokenAmount;
    private maxSlippageInputToken = 0.00;
    private maxSlippageOutputToken = 0.00;

    constructor(private dialogService: DialogService, 
                private ts: TokenService, 
                private store: Store<IState>, 
                private toast: ToastService, 
                private controllerFactory: ValidationControllerFactory, 
                private i18n: I18N,
                private taskQueue: TaskQueue) {

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
                MaxSlippageOutputToken: this.maxSlippageOutputToken
            };

            this.dialogService.open({ viewModel: DswapOrderModal, model: swapRequestModel }).whenClosed(response => {
                console.log(response);
            });
        }
    }

    async refreshTokenLists(){
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens(true, Chain.Hive);
        }

        this.buyTokens = [...this.state.tokens];
        this.sellTokens = [...this.state.tokens];
        
        if (this.buyToken)
            this.sellTokens.splice(this.sellTokens.indexOf(this.sellTokens.find(x => x.symbol == this.buyToken.symbol)), 1);

        if (this.sellToken)
            this.buyTokens.splice(this.buyTokens.indexOf(this.buyTokens.find(x => x.symbol == this.sellToken.symbol)), 1);

        await this.refreshSelectPicker();
    }

    async calcUnitEstimateRate() {
        if (this.buyToken && this.sellToken) {
            this.unitEstimateRate = (this.buyToken.metrics.lastPrice / this.sellToken.metrics.lastPrice).toFixed(8);

            await this.updateTradeValueUsd();            
        }
    }

    async buyTokenSelected() {        
        if (this.chartRefBuy)
            this.chartRefBuy.detached();

        this.chartDataBuy = await this.loadTokenHistoryData(this.buyTokenSymbol);

        if (this.chartRefBuy)
            this.chartRefBuy.attached();
        
        this.buyToken = this.state.tokens.find(x => x.symbol == this.buyTokenSymbol);
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
        this.tradeValueUsd = (this.sellTokenAmount * parseFloat(this.sellToken.metrics.lastPriceUsd)).toFixed(4);
    }

    async sellTokenSelected() {
        if (this.chartRefSell)
            this.chartRefSell.detached();

        this.chartDataSell = await this.loadTokenHistoryData(this.sellTokenSymbol);

        if (this.chartRefSell)
            this.chartRefSell.attached();
        
        this.sellToken = this.state.tokens.find(x => x.symbol == this.sellTokenSymbol);
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

    public async sellTokenAmountInViewChanged() {
        if (this.sellToken) {
            let baseTokenEarnedSell = 0;

            // first get price for the amount of sell tokens you want to sell in SWAP.HIVE
            if (this.sellTokenAmount > 0) {
                baseTokenEarnedSell = await this.getEstimatedBaseTokenEarnedSell(this.sellTokenAmount, this.sellTokenSymbol);
                this.baseTokenAmount = baseTokenEarnedSell;
            }

            // second get amount of buy tokens you would get for the price earned from selling your token
            if (baseTokenEarnedSell > 0) {
                let amount = await this.getEstimatedTokenAmountByBaseToken(baseTokenEarnedSell, this.buyTokenSymbol);                
                this.buyTokenAmount = amount.toFixed(this.buyToken.precision);
            }

            await this.updateTradeValueUsd();
        }
    }

    public async buyTokenAmountInViewChanged() {
        if (this.buyToken) {
            let baseTokenNeeded = 0;

            // first get price needed to buy this buy token amount
            if (this.buyTokenAmount > 0) {
                baseTokenNeeded = await this.getEstimatedBaseTokenEarnedSell(this.buyTokenAmount, this.buyTokenSymbol);
                this.baseTokenAmount = baseTokenNeeded;
            }

            // second get amount of buy tokens you would get for the price earned from selling your token
            if (baseTokenNeeded > 0) {
                let amount = await this.getEstimatedTokenAmountByBaseToken(baseTokenNeeded, this.sellTokenSymbol);
                this.sellTokenAmount = amount.toFixed(this.sellToken.precision);
            }

            await this.updateTradeValueUsd();
        }
    }

    async getEstimatedTokenAmountByBaseToken(baseTokenAmount, tokenSymbol) {
        // get next x buy orders until you reach the amount you want to sell
        let buyTokenAmount = 0;
        let tokensLeft = baseTokenAmount;
        let limit = 10;
        let offset = 0;
        while (tokensLeft > 0 && offset < 100) {
            let orders = await loadSellBook(tokenSymbol, limit, offset);
            if (orders) {
                for (let i = 0; i < orders.length; i++) {
                    let order = orders[i];
                    let orderQuantity = parseFloat(order.quantity);
                    let orderPrice = parseFloat(order.price);

                    let orderCost = orderQuantity * orderPrice;

                    if (tokensLeft <= orderCost) {
                        buyTokenAmount += tokensLeft / orderPrice;
                        tokensLeft = 0;
                    } else {
                        buyTokenAmount += orderQuantity;
                        tokensLeft -= orderCost;
                    }

                    if (tokensLeft == 0) {
                        break;
                    }
                }
            }

            offset += limit;
        }

        return buyTokenAmount;
    }

    async getEstimatedBaseTokenEarnedSell(tokenAmount, tokenSymbol) {
        // get next x buy orders until you reach the amount you want to sell
        let earnedPriceTotal = 0;
        let soldAmount = 0;
        let limit = 10;
        let offset = 0;
        while (soldAmount < tokenAmount && offset < 100) {
            let sellTokenBuyOrders = await loadBuyBook(tokenSymbol, limit, offset);
            if (sellTokenBuyOrders) {
                for (let i = 0; i < sellTokenBuyOrders.length; i++) {
                    let buyOrder = sellTokenBuyOrders[i];                    
                    let buyOrderQuantity = parseFloat(buyOrder.quantity);
                    let buyOrderPrice = parseFloat(buyOrder.price);
                    let diff = tokenAmount - soldAmount;

                    if (buyOrderQuantity <= diff) {
                        soldAmount += buyOrderQuantity;
                        earnedPriceTotal += buyOrderQuantity * buyOrderPrice;
                    } else {                        
                        soldAmount += diff;
                        earnedPriceTotal += diff * buyOrderPrice;
                    }

                    if (soldAmount == tokenAmount) {
                        break;
                    }
                }
            }

            offset += limit;            
        }

        return earnedPriceTotal;
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
                    .satisfies((value: any, object: any) => parseFloat(value) <= this.sellToken.userBalance.balance)
                    .withMessageKey('errors:dashboardInsufficientBalance')
        .rules;

        this.validationController.addObject(this, rules);
    }
}
