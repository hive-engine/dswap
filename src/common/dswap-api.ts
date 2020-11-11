import { HttpClient } from "aurelia-fetch-client";
import { environment } from "../environment";

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
