import { DswapOrderModal } from 'modals/dswap-order';
import { Subscription } from 'rxjs';
import { customElement, autoinject, bindable } from "aurelia-framework";
import { SigninModal } from 'modals/signin';
import { DialogService } from 'aurelia-dialog';
import { connectTo, Store, dispatchify } from 'aurelia-store';
import { faWallet } from '@fortawesome/pro-duotone-svg-icons';
import { AuthService } from 'services/auth-service';
import { environment } from 'environment';
import { getMarketMakerUser } from 'store/actions';
import { getDswapChains } from 'common/functions';
import { ConfirmChainModal } from 'modals/confirm-chain';
import { observable } from 'aurelia-framework';
import { Chain } from 'common/enums';
import { DefaultChainId } from 'common/constants';


@autoinject()
@customElement('swapnav')
@connectTo()
export class SwapNav {
    @bindable router;
    @bindable loggedIn;
    @bindable claims;
    @bindable iconWallet = faWallet;

    public subscription: Subscription;
    private state: IState;
    private dswapEnabled;
    private marketMakerEnabled;
    private chains;
    @observable() selectedChainId;
    private marketMakerUser;

    constructor(private dialogService: DialogService, private authService: AuthService, private store: Store<IState>) {        
        this.subscription = this.store.state.subscribe((state: IState) => {
            if (state) {
                this.state = state;
                this.marketMakerUser = { ...this.state.marketMakerUser };

                if (this.state.loggedIn) {
                    this.selectedChainId = this.state.account.dswapChainId;
                } else {
                    if (this.state.dswapChainId) {
                        this.selectedChainId = this.state.dswapChainId;
                    } else {
                        this.state.dswapChainId = DefaultChainId;
                    }
                }
            }
        });  
    }

    async bind() {        
        this.dswapEnabled = environment.dswapEnabled;
        this.marketMakerEnabled = environment.marketMakerEnabled;
        this.chains = await getDswapChains();        
    }

    async logout() {
        await this.authService.logout();
        this.router.navigateToRoute('home');
    }

    async selectedChainIdChanged(newValue, oldValue) {
        let stateChainId = this.state.loggedIn && this.state.account.dswapChainId ? this.state.account.dswapChainId : this.state.dswapChainId;

        if (oldValue && newValue != stateChainId) {
            let selectedChain = this.chains.find(x => x.id == this.selectedChainId);

            // show warning popup if logged in
            if (this.state.loggedIn) {
                this.dialogService.open({ viewModel: ConfirmChainModal, model: selectedChain }).whenClosed(response => {
                    if (!response.wasCancelled) {
                        this.router.navigateToRoute('home');
                    } else {
                        this.selectedChainId = this.state.dswapChainId;
                    }
                });
            } else {
                this.state.dswapChainId = selectedChain.id;
            }
        } 
    }

    signin() {
        this.dialogService.open({ viewModel: SigninModal }).whenClosed(response => {            
            if (!response.wasCancelled) {
                dispatchify(getMarketMakerUser)();
                // redirect to home if login was successfull
                this.router.navigateToRoute('home');
                
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
