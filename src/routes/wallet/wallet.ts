import { Redirect } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { AuthService } from 'services/auth-service';
import { Store, dispatchify } from 'aurelia-store';
import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { TokenService } from 'services/token-service';

@autoinject()
@customElement('wallet')
export class Wallet {
    public storeSubscription: Subscription;
    private state: IState;
    private wallets: IToken[] = [];
    private user;
    
    constructor(private dialogService: DialogService, private authService: AuthService, private store: Store<IState>, private tokenService: TokenService) {        
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
            }
          });    
    }

    async canActivate() {
        try {            
            await dispatchify(getCurrentFirebaseUser)();
            await dispatchify(getMarketMakerUser)();

            await this.loadWallets();
        } catch (e) {
            console.log(e);
            //return new Redirect('');
        }
    }

    async loadWallets() {
        this.wallets = await this.tokenService.getDSwapTokenBalances();
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }
}
