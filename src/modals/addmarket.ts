import { dispatchify, Store } from "aurelia-store";
import { DialogController } from "aurelia-dialog";
import { autoinject, TaskQueue, bindable } from "aurelia-framework";

import styles from "./dswap-order.module.css";

@autoinject()
export class AddMarketModal {
    private styles = styles;
    constructor(
        private controller: DialogController,

        private store: Store<IState>
    ) {
        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;
    }
}
