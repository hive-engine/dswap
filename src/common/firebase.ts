import { login, setAccount, logout } from 'store/actions';
import { dispatchify } from 'aurelia-store';

import firebase from 'firebase/app';
import * as firebaseSteem from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDTgQorxwEGSXCgmQaQpI4f1lEADwTgMbk',
    authDomain: 'tribaldex-d22e0.firebaseapp.com',
    databaseURL: 'https://tribaldex-d22e0.firebaseio.com',
    projectId: 'tribaldex-d22e0',
    storageBucket: 'tribaldex-d22e0.appspot.com',
    messagingSenderId: '884996152894',
    appId: '1:884996152894:web:c0ef769b4556858b717b6f',
    measurementId: 'G-EPE7FWN2MB'
};

const firebaseConfigSteem = {
    apiKey: "AIzaSyDDPjgEMwAD1PU3PG5Dinci2QjRmQ5Pi4k",
    authDomain: "steem-engine-dex.firebaseapp.com",
    databaseURL: "https://steem-engine-dex.firebaseio.com",
    projectId: "steem-engine-dex",
    storageBucket: "steem-engine-dex.appspot.com",
    messagingSenderId: "947796838950",
    appId: "1:947796838950:web:af5b8ba241cc4910"
};

firebase.initializeApp(firebaseConfig);
firebaseSteem.initializeApp(firebaseConfigSteem, "firebaseSteem");

export async function authStateChanged() {
    return new Promise(resolve => {
        firebase.auth().onAuthStateChanged(async user => {
            // eslint-disable-next-line no-undef
            const token = await firebase.auth()?.currentUser?.getIdTokenResult(true);

            if (user) {
                dispatchify(login)(user.uid);
                if (token) {
                    dispatchify(setAccount)({token});
                }
                resolve();
            } else {
                dispatchify(logout)();
                resolve();
            }
        });
    });
}

export async function authStateChangedSteem() {
    return new Promise(resolve => {        
        firebaseSteem.auth().onAuthStateChanged(async user => {
            // eslint-disable-next-line no-undef
            const token = await firebaseSteem.auth()?.currentUser?.getIdTokenResult(true);

            if (user) {
                dispatchify(login)(user.uid);
                if (token) {
                    dispatchify(setAccount)({ token });
                }
                resolve();
            } else {
                dispatchify(logout)();
                resolve();
            }
        });
    });
}

export async function getFirebaseUser(username: string) {
    const doc = await firebase
        .firestore()
        .collection('users')
        .doc(username)
        .get();

    return doc.exists ? doc.data() : null;
}

export async function getFirebaseUserSteem(username: string) {
    const doc = await firebaseSteem
        .firestore()
        .collection('users')
        .doc(username)
        .get();

    return doc.exists ? doc.data() : null;
}
