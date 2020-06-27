import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from '../../modals/dswap-order';
import { DialogService } from 'aurelia-dialog';

@autoinject()
@customElement('receive-address')
export class ReceiveAddress {

    constructor(private dialogService: DialogService) {}

    getReceiveAddress() {
        console.log('This will be your Receive Address');
    }
}
