import styles from "./market-maker-dashboard.module.css";
import { autoinject, bindable } from "aurelia-framework";
import { AddMarketModal } from "modals/addmarket";
import { ConfirmationModal } from "modals/confirmation";
import { DialogService, DialogCloseResult } from "aurelia-dialog";
import { DialogController } from "aurelia-dialog";
import { Store, dispatchify } from "aurelia-store";
import { Router } from 'aurelia-router';
import { Subscription } from 'rxjs';

@autoinject
export class MarketMakerDashboard {
    private styles = styles;
    private isClicked: false;
    public subscription: Subscription;
    private marketMakerUser;
    private user;
    private state: IState;

    constructor(private dialogService: DialogService, private store: Store<IState>, private router: Router) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };
            }
        });
    }

    async bind() {
        
    }

    async canActivate() {
        // return to landing page if user doesn't exist in market maker user table
        if (!this.marketMakerUser || !this.marketMakerUser._id || this.marketMakerUser._id <= 0) {
            console.log('test');
            this.router.navigate('market-maker');
        }
    }

    async activate() {
        $(".toggle").click(function (e) {
            e.preventDefault();
            $(this).toggleClass("toggle-on").toggleClass("toggle-text-off");
        });
    }

    addMarket() {
        this.dialogService
            .open({ viewModel: AddMarketModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
        console.log("market added");
    }
    confirmEnable() {
        this.dialogService
            .open({ viewModel: ConfirmationModal })
            .whenClosed((x) => this.walletDialogCloseResponse(x));
        console.log("market added");
    }
    walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);

        // reload data if necessary
        if (!response.wasCancelled) {
        }
    }
}
