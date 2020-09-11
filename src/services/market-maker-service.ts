import { Subscription } from 'rxjs';
import { lazy, autoinject } from 'aurelia-framework';
import { HttpClient, json } from 'aurelia-fetch-client';
import { environment } from 'environment';
import { ToastMessage, ToastService } from './toast-service';
import { I18N } from 'aurelia-i18n';
import { Store, dispatchify } from 'aurelia-store';
import moment from 'moment';
import { loadMarkets, loadMarketsByUser } from 'common/market-maker-api';
import { Chain, OrderStrategy } from 'common/enums';
import { hiveSignerJson } from 'common/hive';
import { checkTransaction } from 'common/hive-engine-api';

const http = new HttpClient();

@autoinject()
export class MarketMakerService {
    public http: HttpClient;
    public state: IState;

    public user = {
        name: '',
        account: {}
    };

    public marketMakerUser = {

    }

    public storeSubscription: Subscription;

    constructor(@lazy(HttpClient) getHttpClient: () => HttpClient,
        private i18n: I18N,
        private store: Store<IState>,
        private toast: ToastService) {
        this.http = getHttpClient();

        this.http.configure(config => {
            config
                .useStandardConfiguration()
        });

        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;

                this.user = state.account as any;
                this.marketMakerUser = state.marketMakerUser;
            }
        });
    }

    async getMarkets() {
        let markets = await loadMarkets();

        return markets;
    }

    async getUserMarkets(symbols = []) {
        let account = environment.isDebug && environment.debugAccount ? environment.debugAccount : this.getUser();
        let markets = await loadMarketsByUser(account, symbols);

        return markets;
    }

    getUser() {
        return this.user?.name ?? null;
    }

    async register(chain: Chain): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'register',
            contractPayload: {}
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Register for Market Maker', async (response) => {
                        resolve(this.processResponseRegisterKeychain(response));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }    

    async processResponseRegisterKeychain(response) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerRegisterWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerRegisterError', {
                        ns: 'errors',
                        error: transaction.error
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerRegisterSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async disableAccount(chain: Chain): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'turnOff',
            contractPayload: {}
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Disable account for Market Maker', async (response) => {
                        resolve(this.processResponseDisableAccountKeychain(response));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }    

    async processResponseDisableAccountKeychain(response) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerTurnOffWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerTurnOffError', {
                        ns: 'errors',
                        error: transaction.error
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerTurnOffSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async enableAccount(chain: Chain): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'turnOn',
            contractPayload: {}
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Enable account for Market Maker', async (response) => {
                        resolve(this.processResponseEnableAccountKeychain(response));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseEnableAccountKeychain(response) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerTurnOnWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerTurnOnError', {
                        ns: 'errors',
                        error: transaction.error
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerTurnOnSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async addMarket(chain: Chain, market: IMarketMakerMarket): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        let contractPayload = this.prepareAddUpdateMarketPayload(market);

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'addMarket',
            contractPayload: { ...contractPayload }
        };
        console.log(transaction_data);
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Add market for Market Maker', async (response) => {
                        resolve(this.processResponseAddMarketKeychain(response, market.symbol));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    prepareAddUpdateMarketPayload(market: IMarketMakerMarket) {
        let contractPayload: any = {};

        if (market.symbol)
            contractPayload.symbol = market.symbol;

        if (market.isEnabled != null)
            contractPayload.isEnabled = market.isEnabled;

        if (market.strategy != null)
            contractPayload.strategy = market.strategy;

        if (market.maxBidPrice != null)
            contractPayload.maxBidPrice = market.maxBidPrice.toString();

        if (market.minSellPrice != null)
            contractPayload.minSellPrice = market.minSellPrice.toString();

        if (market.maxBaseToSpend != null)
            contractPayload.maxBaseToSpend = market.maxBaseToSpend.toString();

        if (market.minBaseToSpend != null)
            contractPayload.minBaseToSpend = market.minBaseToSpend.toString();

        if (market.maxTokensToSell != null)
            contractPayload.maxTokensToSell = market.maxTokensToSell.toString();

        if (market.minTokensToSell != null)
            contractPayload.minTokensToSell = market.minTokensToSell.toString();

        if (market.priceIncrement != null)
            contractPayload.priceIncrement = market.priceIncrement.toString();

        if (market.minSpread != null)
            contractPayload.minSpread = market.minSpread.toString();

        if (market.maxDistFromNext != null)
            contractPayload.maxDistFromNext = market.maxDistFromNext.toString();

        if (market.ignoreOrderQtyLt != null)
            contractPayload.ignoreOrderQtyLt = market.ignoreOrderQtyLt.toString();

        if (market.placeAtBidWall != null)
            contractPayload.placeAtBidWall = market.placeAtBidWall.toString();

        if (market.placeAtSellWall != null)
            contractPayload.placeAtSellWall = market.placeAtSellWall.toString();

        return contractPayload;
    }

    async processResponseAddMarketKeychain(response, symbol) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerAddMarketWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerAddMarketError', {
                        ns: 'errors',
                        error: transaction.error,
                        tokenSymbol: symbol,
                        account: transaction.sender
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerAddMarketSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async updateMarket(chain: Chain, market: IMarketMakerMarket): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        let contractPayload = this.prepareAddUpdateMarketPayload(market);

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'updateMarket',
            contractPayload: { ...contractPayload }
        };
        
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Update market for Market Maker', async (response) => {
                        resolve(this.processResponseUpdateMarketKeychain(response, market.symbol));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseUpdateMarketKeychain(response, symbol) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerUpdateMarketWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);                

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerUpdateMarketError', {
                        ns: 'errors',
                        error: transaction.error,
                        tokenSymbol: symbol,
                        account: transaction.sender
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerUpdateMarketSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async removeMarket(chain: Chain, symbol: string): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'removeMarket',
            contractPayload: {
                "symbol": symbol
            }
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Remove market for Market Maker', async (response) => {
                        resolve(this.processResponseRemoveMarketKeychain(response, symbol));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseRemoveMarketKeychain(response, symbol) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerRemoveMarketWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerRemoveMarketError', {
                        ns: 'errors',
                        error: transaction.error,
                        account: this.getUser(),
                        symbol: symbol
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerRemoveMarketSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender,
                        symbol: symbol
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async disableMarket(chain: Chain, symbol: string): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'disableMarket',
            contractPayload: {
                "symbol": symbol
            }
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Disable '+symbol+' market for Market Maker', async (response) => {
                        resolve(this.processResponseDisableMarketKeychain(response, symbol));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseDisableMarketKeychain(response, symbol) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerDisableMarketWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerDisableMarketError', {
                        ns: 'errors',
                        error: transaction.error,
                        account: this.getUser(),
                        symbol: symbol
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerDisableMarketSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender,
                        symbol: symbol
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async enableMarket(chain: Chain, symbol: string): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'enableMarket',
            contractPayload: {
                "symbol": symbol
            }
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Enable ' +symbol+ ' market for Market Maker', async (response) => {
                        resolve(this.processResponseEnableMarketKeychain(response, symbol));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseEnableMarketKeychain(response, symbol) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerEnableMarketWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerEnableMarketError', {
                        ns: 'errors',
                        error: transaction.error,
                        account: this.getUser(),
                        symbol: symbol
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerEnableMarketSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender,
                        symbol: symbol
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    async upgradeAccount(chain: Chain): Promise<unknown> {
        const username = this.getUser();

        if (!username) {
            window.location.reload();
            return;
        }

        const transaction_data = {
            contractName: 'botcontroller',
            contractAction: 'upgrade',
            contractPayload: {}
        };

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            if (chain == Chain.Hive) {
                if (window.hive_keychain) {
                    window.hive_keychain.requestCustomJson(username, environment.chainId, 'Active', JSON.stringify(transaction_data), 'Upgrade account for Market Maker', async (response) => {
                        resolve(this.processResponseUpgradeAccountKeychain(response));
                    });
                } else {
                    hiveSignerJson(this.user.name, 'active', transaction_data, () => {
                        resolve(true);
                    });
                }
            } else {

            }
        });
    }

    async processResponseUpgradeAccountKeychain(response) {
        if (response.success && response.result) {
            try {
                let toast = new ToastMessage();

                toast.message = this.i18n.tr('marketMakerUpgradeAccountWait', {
                    ns: 'notifications'
                });

                this.toast.success(toast);

                const transaction = await checkTransaction(response.result.id, 3);
                console.log(transaction);

                if (transaction.error) {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerUpgradeAccountError', {
                        ns: 'errors',
                        error: transaction.error
                    });

                    this.toast.error(toast);

                    return false;
                } else {
                    toast = new ToastMessage();

                    toast.message = this.i18n.tr('marketMakerUpgradeAccountSuccessful', {
                        ns: 'notifications',
                        account: transaction.sender
                    });

                    this.toast.success(toast);

                    return true;
                }

                return true;
            } catch (e) {
                // Show error toastr: 'An error occurred attempting to unstake tokens: ' + tx.error
                const toast = new ToastMessage();

                toast.message = this.i18n.tr('errorSubmittedTransfer', {
                    ns: 'errors',
                    error: e
                });

                this.toast.error(toast);

                return false;
            }
        } else {
            return false;
        }

        return false;
    }

    getMarketMakerOrderStrategiesByUser(mmUser: IMarketMakerUser) {
        let strategies: IMarketMakerOrderStrategy[] = [];

        if (mmUser && mmUser._id && mmUser._id > 0) {
            let topOfTheBook: IMarketMakerOrderStrategy = {
                _id: OrderStrategy.TopOfTheBook,
                name: 'Top of the book strategy'
            }

            strategies.push(topOfTheBook);

            if (mmUser.isPremium) {
                let wallNestling: IMarketMakerOrderStrategy = {
                    _id: OrderStrategy.WallNestling,
                    name: 'Wall nestling'
                };

                strategies.push(wallNestling);
            }
        }

        return strategies;
    }
}
