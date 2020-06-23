import { autoinject } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { PLATFORM } from 'aurelia-pal';
import { Router, RouterConfiguration, RouterEvent } from 'aurelia-router';
import { environment } from 'environment';
import { MaintenanceStep } from 'resources/pipeline-steps/maintenance';
import { AuthorizeStep } from 'resources/pipeline-steps/authorize';
import { PreRenderStep } from 'resources/pipeline-steps/prerender';
import { PostRenderStep } from 'resources/pipeline-steps/postrender';

import { getCurrentFirebaseUser } from 'store/actions';
import { Store, CallingAction, MiddlewarePlacement, dispatchify } from 'aurelia-store';

function lastCalledActionMiddleware(state: State, originalState: State, settings = {}, action: CallingAction) {
    state.$action = {
        name: action.name,
        params: action.params ?? {},
    };

    return state;
}
@autoinject()
export class App {
  private loggedIn = false;
    private loading = false;
    private claims;
    private notifications = [];

    public router: Router;
    public subscription: Subscription;
    private state: State;

  constructor(
    private ea: EventAggregator,
    private store: Store<State>
) {
    this.store.registerMiddleware(lastCalledActionMiddleware, MiddlewarePlacement.After);
}

bind() {
    this.store.state.subscribe((s: State) => {
        if (s) {
            this.state = s;

            this.loading = s.loading;
            this.loggedIn = s.loggedIn;
            this.claims = s?.account?.token?.claims;
            this.notifications = s?.firebaseUser?.notifications ?? [];
        }
    });

    this.subscription = this.ea.subscribe(RouterEvent.Complete, () => {
        dispatchify(getCurrentFirebaseUser)();
    });
}

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = environment.siteName;

    MaintenanceStep.inMaintenance = environment.maintenanceMode;

    config.options.pushState = true;

    //config.addPipelineStep('authorize', AuthorizeStep);
    config.addPipelineStep('authorize', MaintenanceStep);
    config.addPipelineStep('preRender', PreRenderStep);
    config.addPipelineStep('postRender', PostRenderStep);

    config.map([
        {
            route: ['', 'home'],
            name: 'home',
            moduleId: PLATFORM.moduleName('./routes/home/home', 'home'),
            nav: false,
            title: 'Home',
        },
        {
          route: 'dashboard',
          name: 'dashboard',
          moduleId: PLATFORM.moduleName('./routes/dashboard/dashboard'),
          nav: false,
          title: 'Dashboard',
        },
        {
          route: 'wallet',
          name: 'wallet',
          moduleId: PLATFORM.moduleName('./routes/wallet/wallet'),
          nav: false,
          title: 'Wallet',
        },
        {
          route: 'trades',
          name: 'trades',
          moduleId: PLATFORM.moduleName('./routes/trades/trades'),
          nav: false,
          title: 'trades',
        },
        {
            route: 'maintenance',
            name: 'maintenance',
            moduleId: PLATFORM.moduleName('./routes/maintenance/maintenance'),
            nav: false,
            title: 'We will be right back...',
        },
        {
            route: 'faq',
            name: 'faq',
            moduleId: PLATFORM.moduleName('./routes/faq/faq', 'faq'),            
            nav: false,
            title: 'Faq',
        },
        {
            route: 'send',
            name: 'send',
            moduleId: PLATFORM.moduleName('./routes/send/send', 'send'),            
            nav: false,
            title: 'send',
        },
        {
            route: 'receive',
            name: 'receive',
            moduleId: PLATFORM.moduleName('./routes/receive/receive', 'receive'),            
            nav: false,
            title: 'receive',
        },
        {
            route: 'login',
            name: 'login',
            moduleId: PLATFORM.moduleName('./routes/login/login', 'login'),
            nav: false,
            title: 'Login',
        },
    ]);

    this.router = router;
}
}
