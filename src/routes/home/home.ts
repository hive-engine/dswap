import { customElement, autoinject, bindable } from 'aurelia-framework';
import { Router, RouterConfiguration } from 'aurelia-router';
import { PLATFORM } from 'aurelia-pal';

@autoinject()
export class Home {
    
    addActive(e){
        $('.removeActivate').removeClass('activateIt');
        $('#' + e).addClass('activateIt');
    }
}
