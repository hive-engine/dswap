// import styles from "./faq.module.css";

import { MarketMakerService } from "services/market-maker-service";
import { Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { autoinject } from 'aurelia-framework';
import { Router, Redirect } from 'aurelia-router';

@autoinject()
export class MarketMakerLanding {
    // private styles = styles;
    public subscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;
    private marketMakerUser;

    constructor(private marketMakerService: MarketMakerService, private store: Store<IState>, private router: Router) {
    }

    async bind() {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };

                if (this.marketMakerUser && this.marketMakerUser._id && this.marketMakerUser._id > 0) {
                    this.router.navigate('market-maker-dashboard');
                }
            }
        });

        let markets = await this.marketMakerService.getMarkets();
        console.log('markets');
        console.log(markets);
    }
}
