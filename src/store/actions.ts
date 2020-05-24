import { Container } from 'aurelia-framework';
/* eslint-disable no-undef */
import { initialState } from './state';
import store from './store';

import firebase from 'firebase/app';
import { log } from 'services/log';

import moment from 'moment';

export function loading(state: State, boolean: boolean) {
    const newState = { ...state };

    newState.loading = Boolean(boolean);

    return newState;
}

export function login(state: State, username: string): State {
    const newState = { ...state };

    if (newState?.account) {
        newState.account.name = username;

        newState.loggedIn = true;
    } else {
        const copiedInitialsTate = { ...initialState };

        newState.account = copiedInitialsTate.account;
        newState.account.name = username;
        newState.loggedIn = true;
    }

    return newState;
}

export function logout(state: State): State {
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
    };

    newState.loggedIn = false;

    return newState;
}

export function setAccount(state: State, account: Partial<State['account']>): State {
    const newState = { ...state };

    if (newState?.account) {
        newState.account = Object.assign(newState.account, account);
    }

    return newState;
}

export function setTokens(state: State, tokens: any[]): State {
    const newState = { ...state };

    newState.tokens = tokens;

    return newState;
}

export async function getCurrentFirebaseUser(state: State): Promise<State> {
    const newState = { ...state };

    if (!newState.loggedIn) {
        return newState;
    }

    try {
        const doc = await firebase
            .firestore()
            .collection('users')
            .doc(newState.account.name)
            .get();

        if (doc.exists) {
            newState.firebaseUser = doc.data();

            if (newState?.firebaseUser?.notifications) {
                newState.firebaseUser.notifications = newState.firebaseUser.notifications.filter(
                    notification => !notification.read,
                );
            }
        }
    } catch (e) {
        log.error(e);
    }

    return newState;
}

export function resetInstance(state: State): State {
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
store.registerAction('resetInstance', resetInstance);
