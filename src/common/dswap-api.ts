import { HttpClient } from "aurelia-fetch-client";
import { environment } from "../environment";
import { SwapStatus } from "./enums";

const http = new HttpClient();

export async function swapRequest(swapRequest: ISwapRequestModel) {
    let baseUrl = environment.DSWAP_API_URL;
    let urlToCall = baseUrl + "SwapRequest";

    return http.fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(swapRequest)
    });
}

export async function getSwapRequests(account: string, limit = 20, offset = 0, status?: SwapStatus): Promise<ISwapRequestViewModel[]> {
    let url = `${environment.DSWAP_API_URL}SwapRequest?account=${account}`;

    if (limit) {
        url += `&limit=${limit}`;
    }

    if (offset) {
        url += `&offset=${offset}`;
    }

    if (status) {
        url += `&status=${status}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ISwapRequestViewModel[]>;
}

export async function getSwapRequestById(txId: string): Promise<ISwapRequestViewModel> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/${txId}`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ISwapRequestViewModel>;
}

export async function getSwapRequestsCount(account: string, status?: SwapStatus): Promise<number> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/SwapRequestCount/${account}`;

    if (status) {
        url += `/${status}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<number>;
}

export async function getSwapRequestTransactions(id: string): Promise<any> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/SwapRequestTransactions/${id}`;

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ISwapRequestTransactionViewModel[]>;
}
