import styles from "./market-maker-dashboard.module.css";
import { autoinject, bindable } from "aurelia-framework";
import { AddMarketModal } from "modals/addmarket";
import { ConfirmationModal } from "modals/confirmation";
import { DialogService, DialogCloseResult } from "aurelia-dialog";
import { DialogController } from "aurelia-dialog";
import { Store, dispatchify } from "aurelia-store";
import { Router } from "aurelia-router";
import { Subscription } from "rxjs";
import { DisableAccountModal } from "modals/market-maker/disable-account";
import { getCurrentFirebaseUser } from "store/actions";
import { EnableAccountModal } from "modals/market-maker/enable-account";

@autoinject()
export class MarketMakerDashboard {
    private styles = styles;
    @bindable() isClicked = false;
    public subscription: Subscription;
    private marketMakerUser;
    private user;
    private state: IState;

    constructor(
        private dialogService: DialogService,
        private store: Store<IState>,
        private router: Router
    ) {
        this.subscription = this.store.state.subscribe(
            async (state: IState) => {
                if (state) {
                    this.state = state;

                    this.user = { ...state.firebaseUser };
                    this.marketMakerUser = { ...state.marketMakerUser };
                }
            }
        );
    }

    async bind() {}

    async canActivate() {
        // return to landing page if user doesn't exist in market maker user table
        if (
            !this.marketMakerUser ||
            !this.marketMakerUser._id ||
            this.marketMakerUser._id <= 0
        ) {
            console.log("test");
            this.router.navigate("market-maker");
        }

        console.log(this.marketMakerUser);
    }

    

    addMarket() {
        this.dialogService
            .open({ viewModel: AddMarketModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
        console.log("market added");
    }

    toggleAccountStatus() {
        let currentStatus = this.marketMakerUser.isEnabled;
        let toggledStatus = !currentStatus;
        console.log(toggledStatus);
        if (toggledStatus === true) {
            this.dialogService
                .open({ viewModel: EnableAccountModal })
                .whenClosed((x) => this.walletDialogCloseResponse(x));
        } else {
            this.dialogService
                .open({ viewModel: DisableAccountModal })
                .whenClosed((x) => this.walletDialogCloseResponse(x));
        }

        console.log("market added");
    }

    walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);

        // reload data if necessary
        if (!response.wasCancelled) {
            let v = Math.floor(Math.random() * 1000000 + 1);
            this.router.navigate("market-maker-dashboard?v=" + v, {
                replace: true,
                trigger: true,
            });
        }
    }
}
