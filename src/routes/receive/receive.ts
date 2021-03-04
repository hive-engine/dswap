import { TokenService } from "services/token-service";
import { autoinject, TaskQueue } from "aurelia-framework";
import { Subscription } from "rxjs";
import { DialogService } from "aurelia-dialog";
import { Store } from "aurelia-store";
import { HiveEngineService } from "services/hive-engine-service";
import { ToastService, ToastMessage } from "services/toast-service";
import { ValidationControllerFactory } from "aurelia-validation";
import { I18N } from "aurelia-i18n";
import { BootstrapFormRenderer } from "resources/bootstrap-form-renderer";
import { environment } from 'environment';
import { Chain } from "../../common/enums";
import { loadTokens } from "../../common/hive-engine-api";

@autoinject()
export class Receive {
    public storeSubscription: Subscription;
    public state: IState;
    public tokens: IToken[];
    public tokenSymbol;
    public token;
    private receiveTokenInfo;
    private loading = false;
    private validationController;
    private renderer;
    private dswapEnabled = false;

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<IState>,
        private hes: HiveEngineService,
        private taskQueue: TaskQueue,
        private toast: ToastService, 
        private controllerFactory: ValidationControllerFactory, 
        private i18n: I18N
    ) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;
            }
        });
    }

    async activate({ symbol }) {
        await this.refreshTokenLists();
        this.refreshSelectPicker();
        if (symbol) {
            this.tokenSymbol = symbol;
            await this.tokenSelected();
        }
    }

    async bind() {
        
    }
    
    refreshSelectPicker() {
        $('.selectpicker').selectpicker("refresh");
    }

    async attached() {
        this.refreshSelectPicker();
        this.dswapEnabled = environment.dswapEnabled;
    }

    async refreshTokenLists() {
        const symbols = environment.swapEnabledTokens;
        this.tokens = await loadTokens(symbols);
        await this.ts.enrichTokensWithMetrics(this.tokens, symbols, Chain.Hive);
    }

    async generateAddress() {
        this.taskQueue.queueMicroTask(async () => {
            this.loading = false;

            if (this.token !== "HIVE") {
                this.loading = true;

                try {
                    const result = await this.hes.getDepositAddress(
                        this.tokenSymbol,
                        this.state.account.name
                    );
                    
                    if (result) {
                        this.receiveTokenInfo = result;
                    } else {
                        const toast = new ToastMessage();

                        toast.message = this.i18n.tr("receiveTokenNoAddressError", {
                            tokenSymbol: this.tokenSymbol,
                            ns: 'errors' 
                        });
                        
                        this.toast.error(toast);
                    }
                } finally {
                    this.loading = false;
                }
            }
        });
    }

    async tokenSelected() {
        this.token = this.tokens.find((x) => x.symbol == this.tokenSymbol);
        this.generateAddress();
    }

    // Copy Deposit Address
    copyDepositAddress() {
        // Temporarily Change Styling
        var copyBtn = document.getElementById("copyBtn") as HTMLInputElement;
        var addressValue = document.getElementById("token") as HTMLInputElement;

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

        console.log(addressValue.value);
    }

    // Copy Deposit Address
    copyMemo() {
        // Temporarily Change Styling
        var copyBtn = document.getElementById("copyMemoBtn") as HTMLInputElement;
        var addressValue = document.getElementById("memo") as HTMLInputElement;

        var copyText = document.getElementById("memo") as HTMLInputElement;
        copyText.select();
        document.execCommand("copy");
        console.log("Copied the text: " + copyText.value);
        copyBtn.value = "Text Copied!";
        copyBtn.classList.add("copy-class");

        // Remove Temporary Styling
        setTimeout(() => {
            copyBtn.classList.remove("copy-class");
            copyBtn.value = "Copy Memo";
        }, 3000);

        clearTimeout(
            setTimeout(() => {
                copyBtn.classList.remove("copy-class");
            }, 3000)
        );

        console.log(addressValue.value);
    }
}
