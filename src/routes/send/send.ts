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
    public token;    

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
        this.refreshTokenLists();
    }

    async refreshTokenLists() {
        if (!this.state.tokens) {
            await this.ts.getDSwapTokens();
        }

        this.tokens = [...this.state.tokens];        
    }
    
    async tokenSelected() {
        this.refreshTokenLists();
    }
}
