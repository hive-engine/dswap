export enum Chain {
    Hive = 1,
    Steem = 2
}

export enum OrderStrategy {
    TopOfTheBook = 1,
    WallNestling = 2
}

export enum SwapStatus {
    Init = 1,
    InProgress = 2,
    Success = 3,
    Failure = 4,
    Expired = 7,
    Cancelled = 9,
    SuccessPartial = 10,
    CancelRequested = 11
}

export enum SwapStep {
    ValidateSwapRequest = 5,
    ConvertToSwapToken = 10,
    ConvertToSwapBaseToken = 20,
    ConvertToSwapOutput = 30,
    TransferToDestionationAccount = 40
}
