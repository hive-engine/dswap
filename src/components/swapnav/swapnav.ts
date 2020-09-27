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
import { getDswapChains, getChainByState } from 'common/functions';
import { ConfirmChainModal } from 'modals/confirm-chain';
import { observable } from 'aurelia-framework';
import { Chain } from 'common/enums';
import { DefaultChainId } from 'common/constants';
import { EventAggregator } from 'aurelia-event-aggregator'; 

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
    private currentChainId;
    private username;

    constructor(private dialogService: DialogService, private authService: AuthService, private store: Store<IState>, private ea: EventAggregator) {        
        this.subscription = this.store.state.subscribe((state: IState) => {
            if (state) {
                this.state = state;
                this.marketMakerUser = { ...this.state.marketMakerUser };

                this.setCurrentChain();

                if (this.state.loggedIn && this.state.account.name)
                    this.username = this.state.account.name;
            }
        });  
    }

    async setCurrentChain() {
        this.currentChainId = await getChainByState(this.state);

        if (!this.state.dswapChainId && this.currentChainId)
            this.state.dswapChainId = this.currentChainId;

        this.selectedChainId = this.currentChainId;
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
        if (oldValue && newValue != this.currentChainId) {
            let selectedChain = this.chains.find(x => x.id == this.selectedChainId);
            
            // show warning popup if logged in
            if (this.state.loggedIn) {
                this.dialogService.open({ viewModel: ConfirmChainModal, model: selectedChain }).whenClosed(response => {
                    if (!response.wasCancelled) {
                        this.signin();
                    } else {
                        this.selectedChainId = this.currentChainId;
                    }
                });
            } else {
                this.currentChainId = selectedChain.id;
                this.state.dswapChainId = this.currentChainId;
            }
        } 
    }

    signin() {
        this.dialogService.open({ viewModel: SigninModal, model: this.username }).whenClosed(response => {            
            if (!response.wasCancelled) {
                dispatchify(getMarketMakerUser)();
                this.ea.publish('reloadData');
                
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
