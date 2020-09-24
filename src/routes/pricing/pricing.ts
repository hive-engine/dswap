import { environment } from 'environment';
import { autoinject } from 'aurelia-framework';
import styles from "./pricing.module.css";
import { MarketMakerService } from 'services/market-maker-service';
import { Store } from 'aurelia-store';
import { Router, Redirect } from 'aurelia-router';
import { Subscription } from 'rxjs';
import { DialogService, DialogCloseResult } from 'aurelia-dialog';
import { UpgradeAccountModal } from 'modals/market-maker/upgrade-account';
import { Chain } from 'common/enums';
import { getFeeTokenSymbolByChain } from 'common/functions';
import { EventAggregator, Subscription as eaSubscription } from 'aurelia-event-aggregator'; 

@autoinject()
export class Pricing {
    private styles = styles;
    private feeToken;
    public subscription: Subscription;
    private state: IState;
    private user;
    private marketMakerUser;
    private currentChainId = Chain.Hive;
    private eaSubscriber: eaSubscription;

    constructor(private dialogService: DialogService,
        private marketMakerService: MarketMakerService,
        private store: Store<IState>,
        private router: Router,
        private ea: EventAggregator) {

        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };

                if (this.state.account && this.state.account.dswapChainId) {
                    this.currentChainId = this.state.account.dswapChainId;
                }
            }
        });
    }

    async attached() {
        this.state.activePageId = "pricing";
        this.eaSubscriber = this.ea.subscribe('reloadData', response => {
            this.bind();
        });
    }

    async bind() {        
        this.feeToken = await getFeeTokenSymbolByChain(this.currentChainId);        
    }

    async selectBasic() {
        if (this.marketMakerUser && this.marketMakerUser._id && this.marketMakerUser._id > 0) {
            this.router.navigate('market-maker-dashboard');
        } else {
            this.router.navigate('register-market-maker');
        }
    }

    async selectUpgrade() {
        if (this.marketMakerUser && this.marketMakerUser._id && this.marketMakerUser._id > 0) {
            this.dialogService
                .open({ viewModel: UpgradeAccountModal })
                .whenClosed((x) => this.walletDialogCloseResponse(x));
        } else {
            this.router.navigate('register-market-maker');
        }
    }

    walletDialogCloseResponse(response: DialogCloseResult) {
        // reload data if necessary
        if (!response.wasCancelled) {
            this.router.navigate('market-maker-dashboard');
        }
    }
  
  // FAQ Displays
  handleClick(e) {
    $(".faq-content").css("display", "none");
    $("#faq" + e + "Content").css("display", "block");
    // $('.faq-item' + e ).addClass('active');
    // $('.faq-items').removeClass('active');
  }
}
