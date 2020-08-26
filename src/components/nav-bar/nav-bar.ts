import { Subscription } from 'rxjs';
import { DialogService } from "aurelia-dialog";
import { customElement, bindable } from "aurelia-framework";
import { autoinject } from "aurelia-dependency-injection";
import { connectTo, Store } from "aurelia-store";
import { environment } from 'environment';

import styles from "./nav-bar.module.css";

@autoinject()
@customElement("nav-bar")
@connectTo()
export class NavBar {
    @bindable router;
    private styles = styles;
    private state: IState;
    @bindable() isClicked = false;
    public subscription: Subscription;
    private marketMakerUser;
    private user;
    private markets : IMarketMakerMarket[] = [];
    private marketTokens = [];
    private exchangeMarketUrl;
    private dswapEnabled;
    private marketMakerEnabled;

    constructor(private dialogService: DialogService, private store: Store<IState>) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };                
            }
        });
    }

    async bind() {
        this.dswapEnabled = environment.dswapEnabled;
        this.marketMakerEnabled = environment.marketMakerEnabled;
    }

    async logout() {
        // await this.se.logout();
        //this.router.navigateToRoute('home');
    }
    attached() {
        let idName = window.location.pathname.split("/")[1];
        if (window.location.pathname !== "dashboard") {
            $(".dashboardActive").removeClass("dashboardActive");
            
            if (idName)
                $("#" + idName).addClass("activateIt");
            window.location.pathname.includes("market-maker") &&
                $("#market-maker").addClass("activateIt");
            console.log(idName);
        }
    }

    

    addActive(e) {
        // $(".removeActivate").removeClass("activateIt");
        // $(".dashboardActive").toggleClass("dashboardActive");
        // $("#" + e).addClass("activateIt");
        if (window.location.pathname === "/" + e) {
            $(".removeActivate").removeClass("activateIt");
            $(".dashboardActive").toggleClass("dashboardActive");     

            if (e)       
                $("#" + e).addClass("activateIt");
        }
    }
}
