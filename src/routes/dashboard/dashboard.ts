import { Subscription } from 'rxjs';
import { HiveEngineService } from 'services/hive-engine-service';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';

@autoinject()
@customElement('dashboard')
export class Dashboard {
    public storeSubscription: Subscription;
    public state: State;
    public buyTokens: ICoin[];
    public sellTokens: ICoin[];
    public buyToken;
    public sellToken;
    
    constructor(private dialogService: DialogService, private hes: HiveEngineService, private store: Store<State>) {
        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;
            }
          });       
    }

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }

    async bind() {
        if (!this.state.peggedTokens) {
            await this.hes.getPeggedTokens();
        }

        this.buyTokens = this.state.peggedTokens;
        this.sellTokens = this.state.peggedTokens;
    }

    buyTokenSelected() {

    }

    sellTokenSelected() {

    }
}
