import { TokenService } from 'services/token-service';
import { autoinject, TaskQueue } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';
import { HiveEngineService } from 'services/hive-engine-service';

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

            if (this.token !== 'HIVE') {
                this.loading = true;

                try {
                    const result = await this.hes.getDepositAddress(this.tokenSymbol);
                    
                    if (result) {
                        this.receiveTokenInfo = result;
                    }
                } finally {
                    this.loading = false;
                }
            }
        });

        this.token = this.tokens.find(x => x.symbol == this.tokenSymbol);
    }
}
