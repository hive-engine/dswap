import { HiveEngineService } from 'services/hive-engine-service';
import { Redirect } from "aurelia-router";
import { Subscription } from "rxjs";
import { customElement, autoinject, bindable } from "aurelia-framework";
import { DswapOrderModal } from "modals/dswap-order";
import { DialogService } from "aurelia-dialog";
import { AuthService } from "services/auth-service";
import { Store, dispatchify } from "aurelia-store";
import { TokenService } from "services/token-service";

@autoinject()
@customElement("walletdetail")
export class WalletTokenDetail {
    public storeSubscription: Subscription;
    private state: IState;
    private token: IToken[] = [];
    private user;
    private page = 1;
    private tradesCompleted;
    private symbol;
    private loading = false;
    private offset = 0;
    private limit = 5;
    // to retrieve later from an endpoint
    private totalItems = 50;
    // calculate later based on totalItems
    private totalPages = 10;

    constructor(
        private dialogService: DialogService,
        private authService: AuthService,
        private store: Store<IState>,
        private ts: TokenService,
        private hes: HiveEngineService
    ) {
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
            }
        });
    }

    async activate({ symbol }) {
        this.symbol = symbol;
        this.token = await this.ts.getTokenDetails(symbol);
        this.tradesCompleted = await this.loadTradesCompleted(this.symbol, this.page);
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

        let tradesCompleted = await this.hes.loadAccountHistoryData(this.symbol, this.limit, this.offset);
        
        for(let t of tradesCompleted) {
            let token = await this.ts.getTokenDetails(t.symbol, true, false);
            if (token && token.metrics) {
                t.usdValue = (parseFloat(t.quantity) * parseFloat(token.metrics.lastPriceUsd)).toFixed(2);
            }
        }

        this.loading = false;

        return tradesCompleted;
    }
}
