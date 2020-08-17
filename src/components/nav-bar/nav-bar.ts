//import { SigninModal } from './../../modals/signin';
import { DialogService } from "aurelia-dialog";
import { customElement, bindable } from "aurelia-framework";
import { autoinject } from "aurelia-dependency-injection";
import { connectTo } from "aurelia-store";
//import { faWallet } from '@fortawesome/pro-duotone-svg-icons';

import styles from "./nav-bar.module.css";

@autoinject()
@customElement("nav-bar")
@connectTo()
export class NavBar {
    @bindable router;
    //@bindable loggedIn;
    //@bindable iconWallet = faWallet;

    private styles = styles;

    private state: IState;

    constructor(private dialogService: DialogService) {}

    async logout() {
        // await this.se.logout();
        //this.router.navigateToRoute('home');
    }
    attached() {
        let idName = window.location.pathname.split("/")[1];
        if (window.location.pathname !== "dashboard") {
            $(".dashboardActive").removeClass("dashboardActive");
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
            $("#" + e).addClass("activateIt");
        }
    }
}
