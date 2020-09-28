import { dispatchify, Store } from 'aurelia-store';
import { DialogController } from 'aurelia-dialog';
import { autoinject, TaskQueue, bindable } from 'aurelia-framework';
import { Subscription } from 'rxjs';
import { ValidationControllerFactory, ControllerValidateResult, ValidationRules } from 'aurelia-validation';
import { ToastService, ToastMessage } from 'services/toast-service';
import { BootstrapFormRenderer } from 'resources/bootstrap-form-renderer';
import { I18N } from 'aurelia-i18n';
import { DefaultPopupTimeOut } from 'common/constants';
import { AuthService } from '../services/auth-service';

@autoinject()
export class ConfirmChainModal {
    private loading = false;
    private subscription: Subscription;
    private token: any;
    private validationController;
    private renderer;
    private selectedChain;
    public storeSubscription: Subscription;
    private state: IState;

    constructor(private controller: DialogController,
        private toast: ToastService,
        private taskQueue: TaskQueue,
        private controllerFactory: ValidationControllerFactory,
        private i18n: I18N,
        private store: Store<IState>,
        private authService: AuthService) {
        this.validationController = controllerFactory.createForCurrentScope();

        this.renderer = new BootstrapFormRenderer();
        this.validationController.addRenderer(this.renderer);

        this.controller.settings.lock = false;
        this.controller.settings.centerHorizontalOnly = true;

        this.storeSubscription = this.store.state.subscribe(state => {
            if (state) {
                this.state = state;
            }
        });    
    }

    async activate(selectedChain) {
        this.selectedChain = selectedChain;
    }

    async confirmSwitch() {
        this.loading = true;

        this.state.dswapChainId = this.selectedChain.id;

        if (this.state.loggedIn) {
            await this.authService.logout();

            const toastMessage = new ToastMessage();
            toastMessage.message = this.i18n.tr("marketMakerChainSwitchConfirm", {
                ns: 'notifications'
            });
            toastMessage.overrideOptions.timeout = DefaultPopupTimeOut;
            this.toast.warning(toastMessage);
        }

        this.loading = false;

        this.controller.ok();
    }
}
