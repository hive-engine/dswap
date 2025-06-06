import { TokenService } from 'services/token-service';
import { HiveEngineService } from 'services/hive-engine-service';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { getSwapRequests, getSwapRequestsCount, getSwapRequestById } from 'common/dswap-api';
import { Subscription } from "rxjs";
import { Store, dispatchify } from 'aurelia-store';
import { SwapStatus } from 'common/enums';
import { getCurrentFirebaseUser } from 'store/actions';
import moment from 'moment';
import { DswapSwapdetailsModal } from 'modals/dswap-swapdetails';

@autoinject()
@customElement('trades')
export class Trades {
    private limit = 5;
    private offset = 0;
    @bindable() page = 1;    
    private symbol;
    private tradesCompleted;
    private tradesPending;
    private tradesFailed;
    private allTrades;
    private loading = false;
    // to retrieve later from an endpoint
    private totalItems = 50;
    // calculate later based on totalItems
    @bindable() totalPages = 9;
    private currentChainId;
    public subscription: Subscription;
    private state: IState;
    @bindable() swapStatus?: SwapStatus;

    constructor(private dialogService: DialogService, private hes: HiveEngineService, private ts: TokenService, private store: Store<IState>) {
        
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }

    viewSwapDetails(trade) {
        this.dialogService.open({ viewModel: DswapSwapdetailsModal, model: trade }).whenClosed(response => {
            console.log(response);
        });
    }

    async swapStatusChanged() {
        this.totalItems = await getSwapRequestsCount(this.state.account.name, this.swapStatus);
        await this.calcTotals();
        this.allTrades = await this.loadTradesCompleted(1, this.swapStatus);
    }

    async calcTotals() {
        this.totalPages = this.totalItems / this.limit;
        if (this.totalItems % this.limit > 0)
            this.totalPages += 1;

        console.log(this.totalPages);
    }

    async canActivate({ symbol, page = 1 })
    {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                if (this.state.account.name) {
                    this.allTrades = await this.loadTradesCompleted(page, this.swapStatus);                    
                    this.totalItems = await getSwapRequestsCount(this.state.account.name, this.swapStatus);
                    await this.calcTotals();
                }
            }
        });

        this.state.activePageId = "trades";
    }

    async bind() {
        //this.state.activePageId = "trades";
    }

    async pageClick(pageVal) {
        console.log("pageclick");
        console.log(pageVal);
        if (pageVal == 'prev')
            this.page -= 1;
        else if (pageVal == 'next') 
            this.page += 1;

        this.allTrades = await this.loadTradesCompleted(this.page, this.swapStatus);        
    }

    async pageChanged(newVal) {   
        this.allTrades = await this.loadTradesCompleted(this.page, this.swapStatus);        
    }

    async getTransactionInfo(trade) {
        this.loading = true;
        let tx = await getSwapRequestById(trade.Id);        
        trade.SwapStatusId = tx.SwapStatusId;
        trade.TokenOutputAmountActual = tx.TokenOutputAmountActual;
        this.loading = false;
    }

    async loadTradesCompleted(page, status) {
        this.loading = true;
        this.page = page;
        this.offset = (this.page - 1) * this.limit;

        let trades = await getSwapRequests(this.state.account.name, this.limit, this.offset, status);
        for (let t of trades) {
            t.timestamp_month_name = moment(t.CreatedAt).format('MMMM');
            t.timestamp_day = moment(t.CreatedAt).format('DD');
            t.timestamp_time = moment(t.CreatedAt).format('HH:mm');
            t.timestamp_year = moment(t.CreatedAt).format('YYYY');
        }

        this.loading = false;

        return trades;
    }
}
