import { TokenService } from "services/token-service";
import { autoinject, TaskQueue } from "aurelia-framework";
import { Subscription } from "rxjs";
import { DialogService } from "aurelia-dialog";
import { Store } from "aurelia-store";
import { HiveEngineService } from "services/hive-engine-service";

@autoinject()
export class Receive {
    public storeSubscription: Subscription;
    public state: IState;
    public tokens: IToken[];
    public tokenSymbol;
    public token;
    private receiveTokenInfo;
    private loading = false;

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<IState>,
        private hes: HiveEngineService,
        private taskQueue: TaskQueue
    ) {
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;
            }
        });
    }

    async bind() {
        this.refreshTokenLists();
    }

    async refreshTokenLists() {
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.tokens = [...this.state.tokens];
    }

    async tokenSelected() {
        this.taskQueue.queueMicroTask(async () => {
            this.loading = false;

            if (this.token !== "HIVE") {
                this.loading = true;

                try {
                    const result = await this.hes.getDepositAddress(
                        this.tokenSymbol
                    );

                    if (result) {
                        this.receiveTokenInfo = result;
                    }
                } finally {
                    this.loading = false;
                }
            }
        });

        this.token = this.tokens.find((x) => x.symbol == this.tokenSymbol);
    }

    // Copy Deposit Address
    copyDepositAddress() {
        // Temporarily Change Styling
        var copyBtn = document.getElementById("copyBtn") as HTMLInputElement;
        var addressValue = document.getElementById("token") as HTMLInputElement;

        if (addressValue.value! != "" || null) {
            var copyText = document.getElementById("token") as HTMLInputElement;
            copyText.select();
            document.execCommand("copy");
            console.log("Copied the text: " + copyText.value);
            copyBtn.value = "Text Copied!";
            copyBtn.classList.add("copy-class");

            // Remove Temporary Styling
            setTimeout(() => {
                copyBtn.classList.remove("copy-class");
                copyBtn.value = "Copy Address";
            }, 3000);

            clearTimeout(
                setTimeout(() => {
                    copyBtn.classList.remove("copy-class");
                }, 3000)
            );
        } else {
            copyBtn.value = "Generate Address";
            // Generate New Address from username
        }

        console.log(addressValue.value);
    }
}
