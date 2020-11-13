import { TokenService } from 'services/token-service';
import { HiveEngineService } from 'services/hive-engine-service';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { getSwapRequests } from 'common/dswap-api';
import { Subscription } from "rxjs";
import { Store } from 'aurelia-store';

@autoinject()
@customElement('trades')
export class Trades {
    private limit = 50;
    private offset = 0;
    private page = 1;    
    private symbol;
    private tradesCompleted;
    private tradesPending;
    private tradesFailed;
    private allTrades;
    private loading = false;
    // to retrieve later from an endpoint
    private totalItems = 50;
    // calculate later based on totalItems
    private totalPages = 9;
    private currentChainId;
    public subscription: Subscription;
    private state: IState;

    constructor(private dialogService: DialogService, private hes: HiveEngineService, private ts: TokenService, private store: Store<IState>) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;
            }
        });
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }

    async canActivate({ symbol, page = 1 })
    {
        this.allTrades = await getSwapRequests(this.state.account.name, this.limit, this.offset);
        console.log(this.allTrades);
        this.tradesCompleted = await this.loadTradesCompleted(symbol, page);

        this.state.activePageId = "trades";
    }

    async bind() {
        //this.state.activePageId = "trades";
    }

    async pageClick(pageVal) {
        if (pageVal == 'prev')
            pageVal = this.page - 1;
        else if (pageVal == 'next') 
            pageVal = this.page + 1;

        this.tradesCompleted = await this.loadTradesCompleted(this.symbol, pageVal);
    }

    async loadTradesCompleted(symbol, page) {
        this.loading = true;
        this.symbol = symbol;
        this.page = page;
        this.offset = (this.page - 1) * this.limit;

        let trades = [];
        //for (let t of trades) {
        //    let token = await this.ts.getTokenDetails(t.symbol, this.currentChainId, true, false);
        //    if (token && token.metrics) {
        //        t.usdValue = (parseFloat(t.quantity) * parseFloat(token.metrics.lastPriceUsd)).toFixed(2);
        //    }
        //}

        this.loading = false;

        return trades;
    }
}
