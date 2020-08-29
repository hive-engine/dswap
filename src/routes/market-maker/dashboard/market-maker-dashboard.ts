import styles from "./market-maker-dashboard.module.css";
import { autoinject, bindable } from "aurelia-framework";
import { AddMarketModal } from "modals/market-maker/add-market";
import { ConfirmationModal } from "modals/confirmation";
import { DialogService, DialogCloseResult } from "aurelia-dialog";
import { DialogController } from "aurelia-dialog";
import { Store, dispatchify } from "aurelia-store";
import { Router } from "aurelia-router";
import { Subscription } from "rxjs";
import { DisableAccountModal } from "modals/market-maker/disable-account";
import { getCurrentFirebaseUser } from "store/actions";
import { EnableAccountModal } from "modals/market-maker/enable-account";
import { MarketMakerService } from "services/market-maker-service";
import { RemoveMarketModal } from "modals/market-maker/remove-market";
import { DisableMarketModal } from "modals/market-maker/disable-market";
import { EnableMarketModal } from "modals/market-maker/enable-market";
import { TokenService } from "services/token-service";
import { environment } from 'environment';
import { UpgradeAccountModal } from "../../../modals/market-maker/upgrade-account";

@autoinject()
export class MarketMakerDashboard {
    private styles = styles;
    @bindable() isClicked = false;
    public subscription: Subscription;
    private marketMakerUser;
    private user;
    private state: IState;
    private markets : IMarketMakerMarket[] = [];
    private marketTokens = [];
    private exchangeMarketUrl;

    constructor(private dialogService: DialogService, private store: Store<IState>, private router: Router, private mms: MarketMakerService, private ts: TokenService) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                    this.user = { ...state.firebaseUser };
                    this.marketMakerUser = { ...state.marketMakerUser };
                }
            }
        );
    }

    async bind() {
        this.loadMarkets();
        this.exchangeMarketUrl = environment.EXCHANGE_URL + "?p=market&t=";
    }

    async loadMarkets() {
        this.markets = await this.mms.getUserMarkets();          
        if (this.markets) {
            let tokenSymbols = this.markets.map(x => x.symbol);            
            this.marketTokens = await this.ts.getMarketMakerTokens(tokenSymbols);

            for (let m of this.markets) {
                let token = this.marketTokens.find(x => x.symbol == m.symbol);
                if (token)
                    m.icon = token.metadata.icon;
            }
        }
    }

    async attached() {
        $(".toggle").click(function (e) {
            e.preventDefault();
            $(this).toggleClass("toggle-on").toggleClass("toggle-text-off");
        });
    }

    addMarket() {
        this.dialogService
            .open({ viewModel: AddMarketModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    removeMarket(market) {
        this.dialogService
            .open({ viewModel: RemoveMarketModal, model: market })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    disableMarket(market) {
        this.dialogService
            .open({ viewModel: DisableMarketModal, model: market })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    enableMarket(market) {
        this.dialogService
            .open({ viewModel: EnableMarketModal, model: market })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    upgradeAccount() {
        this.dialogService
            .open({ viewModel: UpgradeAccountModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
    }

    toggleAccountStatus() {
        let currentStatus = this.marketMakerUser.isEnabled;
        let toggledStatus = !currentStatus;
        
        if (toggledStatus === true) {
            this.dialogService
                .open({ viewModel: EnableAccountModal })
                .whenClosed((x) => this.walletDialogCloseResponse(x));
        } else {
            this.dialogService
                .open({ viewModel: DisableAccountModal })
                .whenClosed((x) => this.walletDialogCloseResponse(x));
        }        
    }

    walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);

        // reload data if necessary
        if (!response.wasCancelled) {
            let v = Math.floor((Math.random() * 1000000) + 1);
            this.router.navigate('market-maker-dashboard?v=' + v, { replace: true, trigger: true });            
            this.loadMarkets();
        }
    }
}
