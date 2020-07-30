import styles from "./market-maker-dashboard.module.css";
import { autoinject, bindable } from "aurelia-framework";
import { AddMarketModal } from "modals/addmarket";
import { SigninModal } from "modals/signin";
import { DialogService, DialogCloseResult } from "aurelia-dialog";
import { DialogController } from "aurelia-dialog";
import { Store, dispatchify } from "aurelia-store";

@autoinject
export class MarketMakerDashboard {
    @bindable router;
    private styles = styles;
    private isClicked: false;

    constructor(
        private dialogService: DialogService,

        private store: Store<IState>
    ) {}

        attached (){
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
    walletDialogCloseResponse(response: DialogCloseResult) {
        console.log(response);

        // reload data if necessary
        if (!response.wasCancelled) {
        }
    }
}
