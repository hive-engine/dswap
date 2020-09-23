import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import firebase from 'firebase/app';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store, dispatchify } from 'aurelia-store';
import hivejs from '@hivechain/hivejs';
import { hiveSignerJson, getAccount } from 'common/hive';
import { Chain } from 'common/enums';
import { DefaultPopupTimeOut, firebaseSteemAppName, firebaseHiveAppName } from 'common/constants';
import { logout } from 'store/actions';

const http = new HttpClient();
const httpSe = new HttpClient();

@autoinject()
export class AuthService {
    public http: HttpClient;
    public state: IState;

    public user = {
      name: '',
      account: {}
    };

    public storeSubscription: Subscription;

    constructor(@lazy(HttpClient) getHttpClient: () => HttpClient,
    private i18n: I18N,
    private store: Store<IState>,
    private toast: ToastService) {
        http.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(environment.FIREBASE_API_HE)
        });

        httpSe.configure(config => {
            config
                .useStandardConfiguration()
                .withBaseUrl(environment.FIREBASE_API_SE)
        });
        
        this.storeSubscription = this.store.state.subscribe(state => {
          if (state) {
              this.state = state;

              this.user = state.account as any;
          }
        });
    }

    async getIdToken(chain: Chain) {
        if (chain === Chain.Steem) {
            let firebaseSteem = firebase.apps.find(x => x.name === firebaseSteemAppName);
            return firebaseSteem.auth().currentUser.getIdToken();
        } else if (chain === Chain.Hive) {
            let firebaseHive = firebase.apps.find(x => x.name === firebaseHiveAppName);
            return firebaseHive.auth().currentUser.getIdToken();
        }

        return firebase.auth().currentUser.getIdToken();
    }

    async getUserAuthMemo(username: string, chain: Chain): Promise<string> {
        let res: any;

        if (chain === Chain.Hive) {
            res = await http.fetch(`getUserAuthMemo/${username}/`);
        } else if (chain === Chain.Steem) {
            res = await httpSe.fetch(`getUserAuthMemo/${username}/`);
        }

        const obj = await res.json();

        return obj.memo;
    }

    async verifyUserAuthMemo(username, signedKey, chain: Chain): Promise<unknown> {
        let res: any;
        if (chain === Chain.Hive) {
            res = await http.fetch('verifyUserAuthMemo/', {
                method: 'POST',
                body: json({
                    username,
                    signedKey
                })
            });
        } else if (chain === Chain.Steem) {
            res = await httpSe.fetch('verifyUserAuthMemo/', {
                method: 'POST',
                body: json({
                    username,
                    signedKey
                })
            });
        }

        const obj = await res.json();

        return obj.token;
    }

    async loginSteem(username: string, key?: string, chain?: Chain): Promise<unknown> {
        return new Promise(async (resolve) => {
            if (window.steem_keychain && !key) {
                // Get an encrypted memo only the user can decrypt with their private key
                const encryptedMemo = await this.getUserAuthMemo(username, chain) as string;

                window.steem_keychain.requestVerifyKey(username, encryptedMemo, 'Posting', async response => {
                    if (response.error) {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr('errorLogin', {
                            ns: 'errors'
                        });
                        toast.overrideOptions.timeout = DefaultPopupTimeOut;

                        this.toast.error(toast);

                        resolve(false);
                    } else {
                        // Get the return memo and remove the '#' at the start of the private memo
                        const signedKey = (response.result as unknown as string).substring(1);

                        // The decrypted memo is an encrypted string, so pass this to the server to get back refresh and access tokens
                        const token = await this.verifyUserAuthMemo(response.data.username, signedKey, chain) as string;

                        let firebaseSteem = firebase.apps.find(x => x.name === firebaseSteemAppName);
                        await firebaseSteem.auth().signInWithCustomToken(token);

                        resolve({ username, token });
                    }
                });
            } else {

            }
        });
    };

    async loginHive(username: string, key?: string, chain?: Chain): Promise<unknown> {
        return new Promise(async (resolve) => {
            if (window.hive_keychain && !key) {
                // Get an encrypted memo only the user can decrypt with their private key
                const encryptedMemo = await this.getUserAuthMemo(username, chain) as string;

                window.hive_keychain.requestVerifyKey(username, encryptedMemo, 'Posting', async response => {
                    if (response.error) {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr('errorLogin', {
                            ns: 'errors'
                        });
                        toast.overrideOptions.timeout = DefaultPopupTimeOut;

                        this.toast.error(toast);

                        resolve(false);
                    } else {
                        // Get the return memo and remove the '#' at the start of the private memo
                        const signedKey = (response.result as unknown as string).substring(1);

                        // The decrypted memo is an encrypted string, so pass this to the server to get back refresh and access tokens
                        const token = await this.verifyUserAuthMemo(response.data.username, signedKey, chain) as string;

                        await firebase.auth().signInWithCustomToken(token);

                        resolve({ username, token });
                    }
                });
            } else {
                try {
                    if (key && !hivejs.auth.isWif(key)) {
                        key = hivejs.auth.getPrivateKeys(username, key, ['posting']).posting;
                    }
                } catch (err) {
                    const toast = new ToastMessage();

                    toast.message = this.i18n.tr('invalidPrivateKeyOrPassword', {
                        ns: 'errors'
                    });
                    toast.overrideOptions.timeout = DefaultPopupTimeOut;

                    this.toast.error(toast);

                    resolve(false);
                }

                try {
                    const user = await getAccount(username);

                    if (user) {
                        try {
                            if (hivejs.auth.wifToPublic(key) == user.memo_key || hivejs.auth.wifToPublic(key) === user.posting.key_auths[0][0]) {
                                // Get an encrypted memo only the user can decrypt with their private key
                                const encryptedMemo = await this.getUserAuthMemo(username, chain);

                                // Decrypt the private memo to get the encrypted string
                                const signedKey = hivejs.memo.decode(key, encryptedMemo).substring(1);

                                // The decrypted memo is an encrypted string, so pass this to the server to get back refresh and access tokens
                                const token = await this.verifyUserAuthMemo(username, signedKey, chain) as string;

                                await firebase.auth().signInWithCustomToken(token);

                                resolve({ username, token });
                            } else {
                                const toast = new ToastMessage();

                                toast.message = this.i18n.tr('errorLogin', {
                                    ns: 'errors'
                                });
                                toast.overrideOptions.timeout = DefaultPopupTimeOut;

                                this.toast.error(toast);

                                resolve(false);
                            }
                        } catch (err) {
                            const toast = new ToastMessage();

                            toast.message = this.i18n.tr('errorLogin', {
                                ns: 'errors'
                            });
                            toast.overrideOptions.timeout = DefaultPopupTimeOut;

                            this.toast.error(toast);

                            resolve(false);
                        }
                    } else {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr('errorLoading', {
                            ns: 'errors'
                        });
                        toast.overrideOptions.timeout = DefaultPopupTimeOut;

                        this.toast.error(toast);

                        resolve(false);
                    }
                } catch (e) {
                    return;
                }
            }
        });
    }

    async login(username: string, key?: string, chain?: Chain): Promise<unknown> {
        // eslint-disable-next-line no-async-promise-executor
        if (chain === Chain.Steem) {
            return this.loginSteem(username, key, chain);
        } else if (chain === Chain.Hive) {
            return this.loginHive(username, key, chain);
        }
    }

    async logout() {        
        dispatchify(logout)();

        let firebaseSteem = firebase.apps.find(x => x.name === firebaseSteemAppName);
        firebaseSteem.auth().signOut();

        let firebaseHive = firebase.apps.find(x => x.name === firebaseHiveAppName);
        firebaseHive.auth().signOut();

        return true;
    }
}
