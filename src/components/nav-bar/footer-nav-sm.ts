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
    private activePageId;

    constructor(private dialogService: DialogService, private store: Store<IState>) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;

                this.user = { ...state.firebaseUser };
                this.marketMakerUser = { ...state.marketMakerUser };          

                this.activePageId = state.activePageId;
            }
        });
    }

    async bind() {
        this.dswapEnabled = environment.dswapEnabled;
        this.marketMakerEnabled = environment.marketMakerEnabled;
    }

    attached() {
    }
}
