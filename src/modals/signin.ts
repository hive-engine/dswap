import { Router } from "aurelia-router";
import { ToastMessage } from "services/toast-service";
import { I18N } from "aurelia-i18n";
import { dispatchify, Store } from "aurelia-store";
//import { HiveEngine } from 'services/hive-engine';
import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import { Subscription } from "rxjs";
import { environment } from "environment";
import { ToastService } from "services/toast-service";
import { login } from "store/actions";

import styles from "./signin.module.css";
import { AuthService } from "services/auth-service";
import { getDswapChains, getChainByState } from "../common/functions";

@autoinject()
export class SigninModal {
    private styles = styles;
    private environment = environment;
    private subscription: Subscription;
    private loading = false;
    private usePrivateKey = false;
    private username;
    private privateKey;
    private useKeychain = false;
    private state: IState;
    private currentChainId;
    private currentChain;

    constructor(
        private controller: DialogController,
        private authService: AuthService,
        private i18n: I18N,
        private router: Router,
        private toast: ToastService,
        private store: Store<IState>
    ) {
        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;

        this.subscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;                
            }
        });    
    }

    async activate(username?: string) {
        if (username)
            this.username = username;
    }

    async attached() {
        this.currentChainId = await getChainByState(this.state);

        if (window.hive_keychain) {
            window.hive_keychain.requestHandshake(() => {
                this.useKeychain = true;
            });
        }

        if (window.steem_keychain) {
            window.steem_keychain.requestHandshake(() => {
                this.useKeychain = true;
            });
        }

        let chains = await getDswapChains();
        this.currentChain = chains.find(x => x.id === this.currentChainId);
    }

    async keychainSignIn() {
        try {
            this.loading = true;

            const { username } = (await this.authService.login(
                this.username.trim().toLowerCase(),
                null,
                this.currentChain.id
            )) as any;

            if (username) {
                await dispatchify(login)(username, this.currentChain.id);
            }

            this.controller.close(true);

            this.loading = false;
        } catch (e) {
            this.loading = false;
        }
    }

    async keySignIn() {
        try {
            this.loading = true;

            const { username } = (await this.authService.login(
                this.username.trim().toLowerCase(),
                this.privateKey.trim(),
                this.currentChain.id
            )) as any;

            if (username) {
                await dispatchify(login)(username, this.currentChain.id);
            }

            this.controller.close(true);

            this.loading = false;
        } catch (e) {
            this.loading = false;
        }
    }
    hideKeychainBtn() {
        this.usePrivateKey = !this.usePrivateKey;
        document.getElementById("activeKeyBtn").style.display = "none";
    }
}
