//import { SigninModal } from './../../modals/signin';
import { DialogService } from 'aurelia-dialog';
import { customElement, bindable } from 'aurelia-framework';
import { autoinject } from 'aurelia-dependency-injection';
import { connectTo } from 'aurelia-store';
//import { faWallet } from '@fortawesome/pro-duotone-svg-icons';

import styles from './nav-bar.module.css';

@autoinject()
@customElement("nav-bar")
@connectTo()
export class NavBar {
  @bindable router;
  //@bindable loggedIn;
  //@bindable iconWallet = faWallet;

  private styles = styles;

  private state: IState;

  constructor(private dialogService: DialogService) {}

  async logout() {
    // await this.se.logout();
    //this.router.navigateToRoute('home');
  }

  signin() {
    // this.dialogService.open({ viewModel: SigninModal }).whenClosed(response => {
    //     console.log(response);
    //     if (!response.wasCancelled) {
    //         // redirect to home if login was successfull
    //         this.router.navigateToRoute('tokens');
    //     }
    // });
  }

  addActive(e) {
    $(".removeActivate").removeClass("activateIt");
    $(".dashboardActive").toggleClass("dashboardActive");
    $("#" + e).addClass("activateIt");
  }
}
