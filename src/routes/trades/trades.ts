import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from 'modals/dswap-order';
import { DialogService } from 'aurelia-dialog';

@autoinject()
@customElement('trade')
export class Trade {
    constructor(private dialogService: DialogService) {}

    withdraw() {
        this.dialogService.open({ viewModel: DswapOrderModal }).whenClosed(response => {
            console.log(response);
        });
    }
}
