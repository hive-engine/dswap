import { TokenService } from 'services/token-service';
import { autoinject } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';

@autoinject()
export class Send {
    public storeSubscription: Subscription;
    public state: IState;
    public tokens: IToken[];
    public tokenSymbol;
    public token;
    private sendTokenAddress;

    constructor(
        private dialogService: DialogService,
        private ts: TokenService,
        private store: Store<IState>
    ) {
        this.storeSubscription = this.store.state.subscribe((state) => {
            if (state) {
                this.state = state;
            }
        });
    }

    async bind() {
        await this.refreshTokenLists();        
        this.refreshSelectPicker();
    }

    refreshSelectPicker() {
        $('.selectpicker').selectpicker("refresh");
    }

    async attached() {
        this.refreshSelectPicker();
    }

    async refreshTokenLists() {
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.tokens = [...this.state.tokens];        
    }
    
    async tokenSelected() {
        this.token = this.tokens.find(x => x.symbol == this.tokenSymbol);
        if (!this.token.userBalance)
        {
            this.token.userBalance = await this.ts.getUserBalanceOfToken(this.token);
        }
    }
}
