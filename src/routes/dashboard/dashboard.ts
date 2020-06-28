import { Redirect } from 'aurelia-router';
import { ToFixedValueConverter } from 'resources/value-converters/to-fixed';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { Store, dispatchify } from 'aurelia-store';
import { ChartComponent } from 'components/chart/chart';
import { loadTokenMarketHistory, loadTokenMetrics, loadUserBalances } from 'common/hive-engine-api';
import moment from 'moment';
import { getPrices, usdFormat } from 'common/functions';
import { loadAccountBalances, getCurrentFirebaseUser } from 'store/actions';
import { TokenService } from 'services/token-service';

@autoinject()
@customElement('dashboard')
export class Dashboard {
    public storeSubscription: Subscription;
    public state: IState;
    public buyTokens: ICoin[];
    public sellTokens: ICoin[];
    public buyToken;
    public sellToken;
    private sellTokenAmount;
    private buyTokenAmount;
    public buyTokenStats : ITokenStats;
    public sellTokenStats : ITokenStats;
    private unitEstimateRate;
    private tradeValueUsd;
    private loggedIn;
    @bindable() tradePercentage;
    
    private chartRefBuy: ChartComponent;
    private chartRefSell: ChartComponent;

    private chartDataBuy: any = {};
    private chartDataSell: any = {};
    private balances: IBalance[] = [];
    private user;

    constructor(private dialogService: DialogService, private ts: TokenService, private store: Store<IState>) {
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;      
                
                this.balances = [...state.account.balances];
                this.user = { ...state.firebaseUser };
                this.loggedIn = state.loggedIn;
            }
          });       
    }

    async canActivate() {
        try {
            await dispatchify(loadAccountBalances)();
            await dispatchify(getCurrentFirebaseUser)();
        } catch {
            return new Redirect('');
        }
    }

    startTrade() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }

    async bind() {
        this.refreshTokenLists();
    }

    async refreshTokenLists(){
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.buyTokens = [...this.state.tokens];
        this.sellTokens = [...this.state.tokens];

        var buyTokenItem = this.sellTokens.find(x => x.symbol === this.buyToken);
        if (buyTokenItem)
            this.sellTokens.splice(this.sellTokens.indexOf(buyTokenItem), 1);

        var sellTokenItem = this.buyTokens.find(x => x.symbol === this.sellToken);
        if (sellTokenItem)
            this.buyTokens.splice(this.buyTokens.indexOf(sellTokenItem), 1);
    }

    async calcUnitEstimateRate() {
        if (this.buyTokenStats && this.sellTokenStats)
            this.unitEstimateRate = (parseFloat(this.buyTokenStats.lastPrice) / parseFloat(this.sellTokenStats.lastPrice)).toFixed(8);
    }

    async buyTokenSelected() {        
        this.chartRefBuy.detached();
        this.chartDataBuy = await this.loadTokenHistoryData(this.buyToken);

        if (this.chartRefBuy)
            this.chartRefBuy.attached();

        this.refreshTokenLists();        

        let balance = await this.getTokenBalance(this.buyToken);
        this.buyTokenStats = { symbol: this.buyToken, balance: balance } as ITokenStats;
        await this.getTokenMetrics(this.buyToken, this.buyTokenStats);      
        await this.calcUnitEstimateRate();  
    }

    async getTokenBalance(token) {
        if (!this.balances)
            await dispatchify(loadAccountBalances);

        let tokenBalance = this.balances.find(x => x.symbol == token);
        
        if (tokenBalance) {
            return tokenBalance.balance;
        }

        return 0;
    }

    async getTokenMetrics(token: any, tokenStats: ITokenStats) {
        let metrics = await loadTokenMetrics([token]);        
        if (metrics) {
            let tokenMetrics = metrics.find(x => x.symbol === token);
            if (tokenMetrics) {            
                tokenStats.lastPrice = tokenMetrics.lastPrice;
                
                if (!this.state.hivePriceUsd) {
                    let prices = await getPrices();                    
                    if (prices)
                        this.state.hivePriceUsd = prices.hive.usd;                   
                }

                tokenStats.lastPriceUsd = usdFormat(parseFloat(tokenStats.lastPrice), 3, this.state.hivePriceUsd, true); 
                tokenStats.priceChangePercent = tokenMetrics.priceChangePercent;
            }
        }
    }

    async tradePercentageChanged(){
        if (this.buyTokenStats && this.sellTokenStats) {
            this.sellTokenAmount = (this.tradePercentage / 100) * this.sellTokenStats.balance;
            this.buyTokenAmount = (this.sellTokenAmount / this.unitEstimateRate).toFixed(8);
            
            this.tradeValueUsd = (this.sellTokenAmount * parseFloat(this.sellTokenStats.lastPriceUsd)).toFixed(2);
        }
    }

    async sellTokenSelected() {
        this.chartRefSell.detached();
        this.chartDataSell = await this.loadTokenHistoryData(this.sellToken);

        if (this.chartRefSell)
            this.chartRefSell.attached();

        this.refreshTokenLists();
        let balance = await this.getTokenBalance(this.sellToken);
        this.sellTokenStats = { symbol: this.sellToken, balance: balance } as ITokenStats;
        await this.getTokenMetrics(this.sellToken, this.sellTokenStats); 
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
}
