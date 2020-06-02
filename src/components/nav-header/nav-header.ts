//import { SigninModal } from './../../modals/signin';
import { DialogService } from 'aurelia-dialog';
import { customElement, bindable } from 'aurelia-framework';
import { autoinject } from 'aurelia-dependency-injection';
import { connectTo } from 'aurelia-store';
//import { faWallet } from '@fortawesome/pro-duotone-svg-icons';

import styles from './nav-header.module.css';

@autoinject()
@customElement('nav-header')
@connectTo()
export class NavHeader {
    @bindable router;
    @bindable loggedIn;

    private styles = styles;

    constructor(private dialogService: DialogService) {        
      
    }
}
