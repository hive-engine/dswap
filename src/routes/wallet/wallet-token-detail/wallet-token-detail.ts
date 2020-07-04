import { Redirect } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { AuthService } from 'services/auth-service';
import { Store, dispatchify } from 'aurelia-store';
import { getCurrentFirebaseUser, setTokens } from 'store/actions';
import { TokenService } from 'services/token-service';


@autoinject()
@customElement("walletTokenDetail")
export class WalletTokenDetail {
    public storeSubscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;

    constructor(
        private dialogService: DialogService,
        private authService: AuthService,
        private store: Store<IState>,
        private ts: TokenService
    ) {
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
            }
        });
    }

    
}
