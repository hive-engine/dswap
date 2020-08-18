// import styles from "./faq.module.css";

import { MarketMakerService } from "services/market-maker-service";
import { Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { autoinject } from 'aurelia-framework';

@autoinject()
export class MarketMakerLanding {
    // private styles = styles;
    public storeSubscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;
    private marketMakerUser;

    constructor(private marketMakerService: MarketMakerService, private store: Store<IState>) {
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };
            }
        });
    }

    async bind() {
        console.log('bind');
        let markets = await this.marketMakerService.getMarkets();
        console.log(markets);
        console.log(this.marketMakerUser);
    }
}
