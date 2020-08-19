import { Store } from "aurelia-store";
import { Subscription } from 'rxjs';
import { autoinject } from 'aurelia-framework';
import { Router, Redirect } from 'aurelia-router';
import { MarketMakerService } from "services/market-maker-service";
import { Chain } from "common/enums";

@autoinject()
export class RegisterMarketMaker {
    // private styles = styles;
    public subscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;
    private marketMakerUser;

    constructor(private marketMakerService: MarketMakerService, private store: Store<IState>, private router: Router) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };
            }
        });
    }

    async registerClick() {
        console.log('register');
        this.marketMakerService.register(Chain.Hive);
    }

}
