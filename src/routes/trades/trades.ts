import { TokenService } from 'services/token-service';
import { HiveEngineService } from 'services/hive-engine-service';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';

@autoinject()
@customElement('trades')
export class Trades {
    private limit = 5;
    private offset = 0;
    private page = 1;    
    private symbol;
    private tradesCompleted;
    private tradesPending;
    private tradesFailed;
    private loading = false;
    // to retrieve later from an endpoint
    private totalItems = 50;
    // calculate later based on totalItems
    private totalPages = 9;

    constructor(private dialogService: DialogService, private hes: HiveEngineService, private ts: TokenService) {}

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }

    async canActivate({ symbol, page = 1 })
    {        
        this.tradesCompleted = await this.loadTradesCompleted(symbol, page);
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

        let trades = await this.hes.loadAccountHistoryData(this.symbol, this.limit, this.offset);
        for(let t of trades) {
            let token = await this.ts.getTokenDetails(t.symbol, true, false);
            if (token && token.metrics) {
                t.usdValue = (parseFloat(t.quantity) * parseFloat(token.metrics.lastPriceUsd)).toFixed(2);
            }
        }

        this.loading = false;

        return trades;
    }
}
