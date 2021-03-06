import { Container } from 'aurelia-framework';
/* eslint-disable no-undef */
import { initialState } from './state';
import store from './store';

import firebase from 'firebase/app';
import { log } from 'services/log';

import moment from 'moment';
import { loadUserBalances } from 'common/hive-engine-api';
import { dispatchify } from 'aurelia-store';
import { getUser } from 'common/market-maker-api';
import { environment } from 'environment';
import { Chain } from 'common/enums';
import { firebaseHiveAppName, firebaseSteemAppName } from 'common/constants';
import { getChainByState } from '../common/functions';

export function loading(state: IState, boolean: boolean) {
    const newState = { ...state };

    newState.loading = Boolean(boolean);

    return newState;
}

export function login(state: IState, username: string, dswapChainId: number): IState {
    const newState = { ...state };
    if (newState?.account) {
        newState.account.name = username;
        newState.account.dswapChainId = dswapChainId;

        newState.loggedIn = true;
    } else {
        const copiedInitialsTate = { ...initialState };

        newState.account = copiedInitialsTate.account;
        newState.account.name = username;
        newState.account.dswapChainId = dswapChainId;
        newState.loggedIn = true;
    }

    return newState;
}

export function logout(state: IState): IState {
    const newState = { ...state };

    newState.account = {
        name: '',
        token: {},
        account: {},
        balances: [],
        scotTokens: [],
        pendingUnstakes: [],
        notifications: [],
        nfts: [],
        dswapChainId: 0
    };

    newState.loggedIn = false;
    newState.marketMakerUser = {
        account: '',
        creationBlock: 0,
        creationTimestamp: 0,
        enabledMarkets: 0,
        isEnabled: false,
        isOnCooldown: false,
        isPremium: false,
        isPremiumFeePaid: false,
        lastTickBlock: 0,
        lastTickTimestamp: 0,
        markets: 0,
        timeLimit: 0,
        _id: 0        
    };

    return newState;
}

export function setAccount(state: IState, account: Partial<IState['account']>): IState {
    const newState = { ...state };    
    if (newState?.account) {
        newState.account = Object.assign(newState.account, account);
    }

    return newState;
}

export function setTokens(state: IState, tokens: any[]): IState {
    const newState = { ...state };

    newState.tokens = tokens;

    return newState;
}

export async function getCurrentFirebaseUser(state: IState): Promise<IState> {    
    const newState = { ...state };

    if (!newState.loggedIn) {
        return newState;
    }

    try {
        let doc: any;
        let chainId = newState.account.dswapChainId;
        if (chainId == Chain.Hive) {
            let firebaseHive = firebase.apps.find(x => x.name === firebaseHiveAppName);
            doc = await firebaseHive
                .firestore()
                .collection('users')
                .doc(newState.account.name)
                .get();
        } else if (chainId === Chain.Steem) {
            let firebaseSteem = firebase.apps.find(x => x.name === firebaseSteemAppName);
            doc = await firebaseSteem
                .firestore()
                .collection('users')
                .doc(newState.account.name)
                .get();
        }

        if (doc.exists) {
            newState.firebaseUser = doc.data();

            if (newState?.firebaseUser?.notifications) {
                newState.firebaseUser.notifications = newState.firebaseUser.notifications.filter(
                    notification => !notification.read,
                );
            }
        }
    } catch (e) {
        console.log('error firebase user');
        log.error(e);
    }

    return newState;
}

export async function getMarketMakerUser(state: IState): Promise<IState> {
    const newState = { ...state };

    if (!newState.loggedIn) {
        return newState;
    }

    try {
        let account = environment.isDebug && environment.debugAccount ? environment.debugAccount : newState.account.name;
        let currentChainId = await getChainByState(newState);

        let mmUser = await getUser(account, currentChainId);

        if (mmUser) {
            mmUser.creationTimestamp_string = moment.unix(mmUser.creationTimestamp / 1000).format('YYYY-MM-DD HH:mm:ss');
            mmUser.lastTickTimestamp_string = moment.unix(mmUser.lastTickTimestamp / 1000).format('YYYY-MM-DD HH:mm:ss');

            let timeLimitTime = moment.duration(mmUser.timeLimit);
            mmUser.timeLimit_string = timeLimitTime.days() + " days " + timeLimitTime.hours() + " hours " + timeLimitTime.minutes() + " minutes";
        }
        newState.marketMakerUser = mmUser;
    } catch (e) {
        log.error(e);
    }

    return newState;
}

export function resetInstance(state: IState): IState {
    const newState = { ...state };

    newState.instance = null;

    return newState;
}

store.registerAction('loading', loading);
store.registerAction('login', login);
store.registerAction('logout', logout);
store.registerAction('setAccount', setAccount);
store.registerAction('setTokens', setTokens);
store.registerAction('getCurrentFirebaseUser', getCurrentFirebaseUser);
store.registerAction('getMarketMakerUser', getMarketMakerUser);
store.registerAction('resetInstance', resetInstance);
