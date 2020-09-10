import { dispatchify, Store } from 'aurelia-store';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { Router, RouterConfiguration } from 'aurelia-router';
import { PLATFORM } from 'aurelia-pal';
import { Subscription } from 'rxjs';

@autoinject()
export class Home {
    private state: IState;
    private subscription: Subscription;

    constructor(private store: Store<IState>, private router: Router) {
        this.subscription = this.store.state.subscribe(async (state: IState) => {
            if (state) {
                this.state = state;                
            }
        });
    }

    async bind() {
        this.state.activePageId = 'home';
    }
    
    addActive(e){
        $('.removeActivate').removeClass('activateIt');
        $('#' + e).addClass('activateIt');
    }
}
