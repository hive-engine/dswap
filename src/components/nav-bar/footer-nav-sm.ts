import { Subscription } from 'rxjs';
import { DialogService } from "aurelia-dialog";
import { customElement, bindable } from "aurelia-framework";
import { autoinject } from "aurelia-dependency-injection";
import { connectTo, Store } from "aurelia-store";
import { environment } from 'environment';

import styles from "./nav-bar.module.css";

@autoinject()
@customElement("footer-nav-sm")
@connectTo()
export class FooterSm {
    @bindable router;

    private styles = styles;

    private state: IState;
    public subscription: Subscription;
    private marketMakerUser;
    private user;
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

    attached() {
        let idName = window.location.pathname.split("/")[1];
        if (!idName)
            idName = "home";

        if (window.location.pathname !== "dashboard") {
            $(".dashboardActiveMobile").removeClass("dashboardActiveMobile");
            if (idName)
                $("#" + idName + "-mobile").addClass("activateItMobile");            
            
            window.location.pathname.includes("market-maker") &&
                $("#market-maker-mobile").addClass("activateItMobile");
            console.log(idName + "-mobile");
        }
    }

    addMobileActive(e) {
        if (window.location.pathname === "/" + e) {
            $(".removeActivateMobile").removeClass("activateItMobile");
            $(".dashboardActiveMobile").toggleClass("dashboardActiveMobile");
            if (e)
                $("#" + e + "-mobile").addClass("activateItMobile");
        } else if (e == "home") {
            $(".removeActivateMobile").removeClass("activateItMobile");
            $(".dashboardActiveMobile").toggleClass("dashboardActiveMobile");            
            $("#" + e + "-mobile").addClass("activateItMobile");
        }
    }
}
