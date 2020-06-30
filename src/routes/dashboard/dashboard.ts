import { Redirect } from 'aurelia-router';
import { ToFixedValueConverter } from 'resources/value-converters/to-fixed';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { Store, dispatchify } from 'aurelia-store';
import { ChartComponent } from 'components/chart/chart';
import { loadTokenMarketHistory } from 'common/hive-engine-api';
import moment from 'moment';
import { getPrices, usdFormat } from 'common/functions';
import { getCurrentFirebaseUser } from 'store/actions';
import { TokenService } from 'services/token-service';

@autoinject()
@customElement('dashboard')
export class Dashboard {
    public storeSubscription: Subscription;
    public state: IState;
    public buyTokens: IToken[];
    public sellTokens: IToken[];
    public buyTokenSymbol;
    public sellTokenSymbol;
    private sellTokenAmount;
    private buyTokenAmount;
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

    constructor(private dialogService: DialogService, private ts: TokenService, private store: Store<IState>) {
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;
                
                this.user = { ...state.firebaseUser };
                this.loggedIn = state.loggedIn;
            }
          });       
    }

    async canActivate() {
        try {
            if (!this.state.tokens) {
                await this.ts.getDSwapTokens();
            }
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
        
        if (this.buyToken)
            this.sellTokens.splice(this.sellTokens.indexOf(this.sellTokens.find(x => x.symbol == this.buyToken.symbol)), 1);

        if (this.sellToken)
            this.buyTokens.splice(this.buyTokens.indexOf(this.buyTokens.find(x => x.symbol == this.sellToken.symbol)), 1);
    }

    async calcUnitEstimateRate() {
        if (this.buyToken && this.sellToken)
            this.unitEstimateRate = (this.buyToken.metrics.lastPrice / this.sellToken.metrics.lastPrice).toFixed(8);
    }

    async buyTokenSelected() {        
        this.chartRefBuy.detached();
        this.chartDataBuy = await this.loadTokenHistoryData(this.buyTokenSymbol);

        if (this.chartRefBuy)
            this.chartRefBuy.attached();
        
        this.buyToken = this.state.tokens.find(x => x.symbol == this.buyTokenSymbol);
        this.refreshTokenLists();

        if (!this.buyToken.userBalance)
            await this.getTokenBalance(this.buyToken);
        
        await this.calcUnitEstimateRate();  
    }

    async getTokenBalance(token) {                
        if (!token || !token.loadUserBalances) {
            await this.ts.getDSwapTokenBalances();
        } 
    }

    async tradePercentageChanged(){
        if (this.buyToken && this.sellToken) {
            this.sellTokenAmount = (this.tradePercentage / 100) * this.sellToken.userBalance.balance;
            this.buyTokenAmount = (this.sellTokenAmount / this.unitEstimateRate).toFixed(8);
            
            this.tradeValueUsd = (this.sellTokenAmount * parseFloat(this.sellToken.metrics.lastPriceUsd)).toFixed(2);
        }
    }

    async sellTokenSelected() {
        this.chartRefSell.detached();
        this.chartDataSell = await this.loadTokenHistoryData(this.sellTokenSymbol);

        if (this.chartRefSell)
            this.chartRefSell.attached();
        
        this.sellToken = this.state.tokens.find(x => x.symbol == this.sellTokenSymbol);
        this.refreshTokenLists();

        if (!this.sellToken.userBalance)
            await this.getTokenBalance(this.sellToken);

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
