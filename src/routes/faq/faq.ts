import styles from "./faq.module.css";
import { dispatchify, Store } from 'aurelia-store';
import { customElement, autoinject, bindable } from 'aurelia-framework';
import { Router, RouterConfiguration } from 'aurelia-router';
import { PLATFORM } from 'aurelia-pal';
import { Subscription } from 'rxjs';

@autoinject()
export class Faq {
  private styles = styles;

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
        if (this.state) {
            this.state.activePageId = 'faq';
        }
    }

  // FAQ Displays
  handleClick(e) {
    $(".faq-content").css("display", "none");
    $("#faq" + e + "Content").css("display", "block");
    // $('.faq-item' + e ).addClass('active');
    // $('.faq-items').removeClass('active');
  }
}
