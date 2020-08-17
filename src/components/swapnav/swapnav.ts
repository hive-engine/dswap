import { DswapOrderModal } from 'modals/dswap-order';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from "aurelia-framework";
import { SigninModal } from 'modals/signin';
import { DialogService } from 'aurelia-dialog';
import { connectTo, Store } from 'aurelia-store';
import { faWallet } from '@fortawesome/pro-duotone-svg-icons';
import { AuthService } from 'services/auth-service';


@autoinject()
@customElement('swapnav')
@connectTo()
export class SwapNav {
    @bindable router;
    @bindable loggedIn;
    @bindable claims;
    @bindable iconWallet = faWallet;

    public storeSubscription: Subscription;
    private state: IState;

    constructor(private dialogService: DialogService, private authService: AuthService, private store: Store<IState>) {        
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;                
            }
          });    
    }

    async logout() {
        await this.authService.logout();        
        this.router.navigateToRoute('home');
    }

    signin() {
        this.dialogService.open({ viewModel: SigninModal }).whenClosed(response => {            
            if (!response.wasCancelled) {
                // redirect to home if login was successfull
                this.router.navigateToRoute('dashboard');
            }
        });
    }

    initiateMarketMaker() {
        this.dialogService
            .open({ viewModel: DswapOrderModal })
            .whenClosed((response) => {
                console.log(response);
            });
    }
}
