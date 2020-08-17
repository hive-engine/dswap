import { DialogService } from "aurelia-dialog";
import { customElement, bindable } from "aurelia-framework";
import { autoinject } from "aurelia-dependency-injection";
import { connectTo } from "aurelia-store";

import styles from "./nav-bar.module.css";

@autoinject()
@customElement("footer-nav-sm")
@connectTo()
export class FooterSm {
    @bindable router;

    private styles = styles;

    private state: IState;

    constructor(private dialogService: DialogService) {}

    attached() {
        let idName = window.location.pathname.split("/")[1];
        if (window.location.pathname !== "dashboard") {
            $(".dashboardActiveMobile").removeClass("dashboardActiveMobile");
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
            $("#" + e + "-mobile").addClass("activateItMobile");
        }
        console.log(e);
    }
}
