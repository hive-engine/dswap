import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import firebase from 'firebase/app';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store } from 'aurelia-store';
import hivejs from '@hivechain/hivejs';
import { hiveSignerJson, getAccount } from 'common/hive';

const http = new HttpClient();

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
                .withBaseUrl(environment.FIREBASE_API)
        });
        
        this.storeSubscription = this.store.state.subscribe(state => {
          if (state) {
              this.state = state;

              this.user = state.account as any;
          }
        });
    }

    async getIdToken() {
        return firebase.auth().currentUser.getIdToken();
    }

    async getUserAuthMemo(username: string): Promise<string> {
        const res = await http.fetch(`getUserAuthMemo/${username}/`);
        const obj = await res.json();

        return obj.memo;
    }

    async verifyUserAuthMemo(username, signedKey): Promise<unknown> {
        const res = await http.fetch('verifyUserAuthMemo/', {
            method: 'POST',
            body: json({
                username,
                signedKey
            })
        });

        const obj = await res.json();

        return obj.token;
    }

    async login(username: string, key?: string): Promise<unknown> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (window.hive_keychain && !key) {
                // Get an encrypted memo only the user can decrypt with their private key
                const encryptedMemo = await this.getUserAuthMemo(username) as string;

                window.hive_keychain.requestVerifyKey(username, encryptedMemo, 'Posting', async response => {
                    if (response.error) {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr('errorLogin', {
                            ns: 'notifications'
                        });

                        this.toast.error(toast);
                    } else {
                        // Get the return memo and remove the '#' at the start of the private memo
                        const signedKey = (response.result as unknown as string).substring(1);

                        // The decrypted memo is an encrypted string, so pass this to the server to get back refresh and access tokens
                        const token = await this.verifyUserAuthMemo(response.data.username, signedKey) as string;

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

                    this.toast.error(toast);
                    return;
                }

                try {
                    const user = await getAccount(username);

                    if (user) {
                        try {
                            if (hivejs.auth.wifToPublic(key) == user.memo_key || hivejs.auth.wifToPublic(key) === user.posting.key_auths[0][0]) {
                                // Get an encrypted memo only the user can decrypt with their private key
                                const encryptedMemo = await this.getUserAuthMemo(username);

                                // Decrypt the private memo to get the encrypted string
                                const signedKey = hivejs.memo.decode(key, encryptedMemo).substring(1);

                                // The decrypted memo is an encrypted string, so pass this to the server to get back refresh and access tokens
                                const token = await this.verifyUserAuthMemo(username, signedKey) as string;

                                await firebase.auth().signInWithCustomToken(token);

                                resolve({ username, token });
                            } else {
                                const toast = new ToastMessage();

                                toast.message = this.i18n.tr('errorLogin', {
                                    ns: 'notifications'
                                });

                                this.toast.error(toast);
                            }
                        } catch (err) {
                            const toast = new ToastMessage();

                            toast.message = this.i18n.tr('errorLogin', {
                                ns: 'notifications'
                            });

                            this.toast.error(toast);
                        }
                    } else {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr('errorLoading', {
                            ns: 'notifications'
                        });

                        this.toast.error(toast);
                    }
                } catch (e) {
                    return;
                }
            }
        });
    }

    async logout() {
        return firebase.auth().signOut();
        //dispatchify(logout)();
    }
}
