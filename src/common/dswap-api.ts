import { HttpClient } from "aurelia-fetch-client";
import { environment } from "../environment";
import { SwapStatus } from "./enums";

const http = new HttpClient();

export async function swapRequest(swapRequest: ISwapRequestModel): Promise<ISwapRequestResponseModel> {
    let baseUrl = environment.DSWAP_API_URL;
    let urlToCall = baseUrl + "SwapRequest";

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        urlToCall += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(swapRequest)
    });

    return response.json() as Promise<ISwapRequestResponseModel>;
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

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `&api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });    

    return response.json() as Promise<ISwapRequestViewModel[]>;
}

export async function getSwapRequestById(txId: string): Promise<ISwapRequestViewModel> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/${txId}`;

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

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

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<number>;
}

export async function getSwapRequestTransactions(id: string): Promise<any> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/SwapRequestTransactions/${id}`;

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });

    return response.json() as Promise<ISwapRequestTransactionViewModel[]>;
}

export async function calculateSwapOutput(requestModel: ISwapCalcValuesModel): Promise<ISwapCalcValuesModel>{
    let baseUrl = environment.DSWAP_API_URL;
    let urlToCall = baseUrl + "SwapRequest/CalculateSwapOutput";

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        urlToCall += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    let request = await http.fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestModel)
    });

    const response = await request.json();
    return response as Promise<ISwapCalcValuesModel>;
}

export async function calculateSwapInput(requestModel: ISwapCalcValuesModel): Promise<ISwapCalcValuesModel> {
    let baseUrl = environment.DSWAP_API_URL;
    let urlToCall = baseUrl + "SwapRequest/CalculateSwapInput";

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        urlToCall += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    let request = await http.fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestModel)
    });

    const response = await request.json();
    return response as Promise<ISwapCalcValuesModel>;
}

export async function swapRequestDca(swapRequest: ISwapRequestDCAModel): Promise<ISwapRequestDCAResponseModel> {
    let baseUrl = environment.DSWAP_API_URL;
    let urlToCall = baseUrl + "SwapRequest/DCA";

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        urlToCall += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(urlToCall, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(swapRequest)
    });

    return response.json() as Promise<ISwapRequestDCAResponseModel>;
}

export async function getSwapDCARequests(account: string, limit = 20, offset = 0, status?: SwapStatus): Promise<ISwapRequestDCAViewModel[]> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/DCARequests?account=${account}`;

    if (limit) {
        url += `&limit=${limit}`;
    }

    if (offset) {
        url += `&offset=${offset}`;
    }

    if (status) {
        url += `&status=${status}`;
    }

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `&api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });    

    return response.json() as Promise<ISwapRequestDCAViewModel[]>;
}

export async function getSwapDCADetail(id: string): Promise<ISwapRequestDCADetailViewModel> {
    let url = `${environment.DSWAP_API_URL}SwapRequest/DCADetail/${id}`;

    if (environment.DSWAP_API_VERSION != "" && environment.DSWAP_API_VERSION != "1.0") {
        url += `?api-version=${environment.DSWAP_API_VERSION}`;
    }

    const response = await http.fetch(url, {
        method: 'GET',
    });    

    return response.json() as Promise<ISwapRequestDCADetailViewModel>;
}
