import { customElement, autoinject, bindable } from "aurelia-framework";
import { DswapOrderModal } from "../../modals/dswap-order";
import { DialogService } from "aurelia-dialog";


@autoinject()
@customElement("swapnav")
export class SwapNav {
  constructor(private dialogService: DialogService) {}
  
  initiateMarketMaker() {
    this.dialogService
      .open({ viewModel: DswapOrderModal })
      .whenClosed((response) => {
        console.log(response);
      });
  }
}
