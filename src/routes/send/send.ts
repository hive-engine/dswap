import { TokenService } from 'services/token-service';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { ToFixedValueConverter } from 'resources/value-converters/to-fixed';
import { Subscription } from "rxjs";
import { HiveEngineService } from "services/hive-engine-service";
import { DswapOrderModal } from "modals/dswap-order";
import { DialogService } from "aurelia-dialog";
import { Store } from "aurelia-store";
import { ChartComponent } from "components/chart/chart";
import { loadTokenMarketHistory, loadTokenMetrics } from "common/hive-engine-api";
import moment from "moment";
import { getPrices, usdFormat } from "common/functions";

@customElement("send")
@autoinject()
export class Send {
    public storeSubscription: Subscription;
    public state: State;
    public buyTokens: ICoin[];
    public sellTokens: ICoin[];
    public buyToken;
    public sellToken;
    public buyTokenStats: ITokenStats;
    public sellTokenStats: ITokenStats;
    private unitEstimateRate;

    private chartRefBuy: ChartComponent;
    private chartRefSell: ChartComponent;

    private chartDataBuy: any = {};
    private chartDataSell: any = {};

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<State>
    ) {
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;
            }
        });
    }

    withdraw() {
        this.dialogService
            .open({ viewModel: DswapOrderModal })
            .whenClosed((response) => {
                console.log(response);
            });
    }

    async bind() {
        this.refreshTokenLists();
    }

    async refreshTokenLists() {
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.buyTokens = [...this.state.tokens];
        this.sellTokens = [...this.state.tokens];

        var buyTokenItem = this.sellTokens.find(
            (x) => x.symbol === this.buyToken
        );
        if (buyTokenItem)
            this.sellTokens.splice(this.sellTokens.indexOf(buyTokenItem), 1);

        var sellTokenItem = this.buyTokens.find(
            (x) => x.symbol === this.sellToken
        );
        if (sellTokenItem)
            this.buyTokens.splice(this.buyTokens.indexOf(sellTokenItem), 1);
    }

    async calcUnitEstimateRate() {
        this.unitEstimateRate = (
            parseFloat(this.buyTokenStats.lastPrice) /
            parseFloat(this.sellTokenStats.lastPrice)
        ).toFixed(8);
    }

    async buyTokenSelected() {
        

        this.refreshTokenLists();
        this.buyTokenStats = { symbol: this.buyToken } as ITokenStats;
        await this.getTokenMetrics(this.buyToken, this.buyTokenStats);
        await this.calcUnitEstimateRate();
    }

    async getTokenMetrics(token: any, tokenStats: ITokenStats) {
        let metrics = await loadTokenMetrics([token]);
        if (metrics) {
            let tokenMetrics = metrics.find((x) => x.symbol === token);
            if (tokenMetrics) {
                tokenStats.lastPrice = tokenMetrics.lastPrice;

                if (!this.state.hivePriceUsd) {
                    let prices = await getPrices();
                    if (prices) this.state.hivePriceUsd = prices.hive.usd;
                }

                tokenStats.lastPriceUsd = usdFormat(
                    parseFloat(tokenStats.lastPrice),
                    3,
                    this.state.hivePriceUsd,
                    false
                );
                tokenStats.priceChangePercent = tokenMetrics.priceChangePercent;
            }
        }
    }

    async sellTokenSelected() {
       

        if (this.chartRefSell) this.chartRefSell.attached();

        this.refreshTokenLists();
        this.sellTokenStats = { symbol: this.sellToken } as ITokenStats;
        await this.getTokenMetrics(this.sellToken, this.sellTokenStats);
        await this.calcUnitEstimateRate();
    }
}
