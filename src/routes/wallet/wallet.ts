import { Redirect } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { AuthService } from 'services/auth-service';
import { Store, dispatchify } from 'aurelia-store';
import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { TokenService } from 'services/token-service';
import { Chain } from '../../common/enums';
import { isPeggedToken } from '../../common/functions';

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

    async bind() {
        this.state.activePageId = "wallet";
    }

    async loadWallets() {
        let tokens = await this.tokenService.getDSwapTokenBalances(Chain.Hive);
        this.wallets = tokens.filter(x => !x.isCrypto);
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }
}
