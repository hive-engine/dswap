import { customElement, autoinject, bindable } from 'aurelia-framework';
import { DswapOrderModal } from '../../modals/dswap-order';
import { DialogService } from 'aurelia-dialog';

@autoinject()
@customElement('receiveAddress')
export class ReceiveAddress {

    constructor(private dialogService: DialogService) {}

    getReceiveAddress() {
        console.log('This will be your Receive Address');
    }
}
