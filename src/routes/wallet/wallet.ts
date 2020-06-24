import { Redirect } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { AuthService } from 'services/auth-service';
import { Store, dispatchify } from 'aurelia-store';
import { getCurrentFirebaseUser, loadAccountBalances } from 'store/actions';

@autoinject()
@customElement('wallet')
export class Wallet {
    public storeSubscription: Subscription;
    private state: State;
    private balances: BalanceInterface[] = [];
    private user;
    
    constructor(private dialogService: DialogService, private authService: AuthService, private store: Store<State>) {        
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;

                this.balances = [...state.account.balances];
                this.user = { ...state.firebaseUser };
            }
          });    
    }

    async canActivate() {
        try {
            await dispatchify(loadAccountBalances)();
            await dispatchify(getCurrentFirebaseUser)();

            console.log(this.state.tokens.length);
        } catch {
            return new Redirect('');
        }
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }
}
