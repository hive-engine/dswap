import { customElement, autoinject, bindable } from "aurelia-framework";
import { DswapOrderModal } from "../../modals/dswap-order";
//import { SteemEngine } from 'services/steem-engine';
import { SigninModal } from 'modals/signin';
import { DialogService } from 'aurelia-dialog';
import { connectTo } from 'aurelia-store';
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

    private state: State;

    constructor(private dialogService: DialogService, private authService: AuthService) {        
    }

    async logout() {
        await this.authService.logout();        
        this.router.navigateToRoute('home');
    }

    signin() {
        this.dialogService.open({ viewModel: SigninModal }).whenClosed(response => {
            console.log(response);
            if (!response.wasCancelled) {
                // redirect to home if login was successfull
                this.router.navigateToRoute('/');
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
