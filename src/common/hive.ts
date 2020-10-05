import { environment } from 'environment';
import { AuthType } from './types';
import hive from '@hiveio/hive-js';
import { popupCenter } from './functions';

export async function getAccount(username: string) {
    try {
        const user = await hive.api.getAccountsAsync([username]);
    
        return user && user.length > 0 ? user[0] : null;
    } catch (e) {
        throw new Error(e);
    }
}

export async function hiveSignerJson(username: string, auth_type: AuthType, data: any, callback?) {
    let url = 'https://hivesigner.com/sign/custom-json?';

    if (auth_type == 'active') {
        url += 'required_posting_auths=' + encodeURI('[]');
        url += '&required_auths=' + encodeURI('["' + username + '"]');
        url += `&authority=active`;
    } else {
        url += 'required_posting_auths=' + encodeURI('["' + username + '"]');
    }

    url += '&id=' + environment.chainId;
    url += '&json=' + encodeURI(JSON.stringify(data));

    popupCenter(url, 'hivesigner', 500, 560);

    if (callback) {
        window._hs_callback = callback;
    }
}

export async function hiveConnectJsonId(username: string, auth_type: AuthType, id: string, data: any, callback) {
    let url = 'https://hivesigner.com/sign/custom-json?';

    if (auth_type == 'active') {
        url += 'required_posting_auths=' + encodeURI('[]');
        url += '&required_auths=' + encodeURI('["' + username + '"]');
        url += `&authority=active`;
    } else {
        url += 'required_posting_auths=' + encodeURI('["' + username + '"]');
    }

    url += '&id=' + id;
    url += '&json=' + encodeURI(JSON.stringify(data));

    popupCenter(url, 'hivesigner', 500, 560);

    this._hs_callback = callback;
}

export async function hiveConnectTransfer(from: string, to: string, amount: string, memo: string, callback: any) {
    let url = 'https://hivesigner.com/sign/transfer?';
    url += '&from=' + encodeURI(from);
    url += '&to=' + encodeURI(to);
    url += '&amount=' + encodeURI(amount);
    url += '&memo=' + encodeURI(memo);

    popupCenter(url, 'hivesigner', 500, 560);
    window._hs_callback = callback;
}
