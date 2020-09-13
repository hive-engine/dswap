import { autoinject } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { PLATFORM } from 'aurelia-pal';
import { Router, RouterConfiguration, RouterEvent } from 'aurelia-router';
import { environment } from 'environment';
import { MaintenanceStep } from 'resources/pipeline-steps/maintenance';
import { AuthorizeStep } from 'resources/pipeline-steps/authorize';
import { PreRenderStep } from 'resources/pipeline-steps/prerender';
import { PostRenderStep } from 'resources/pipeline-steps/postrender';

import { getCurrentFirebaseUser, getMarketMakerUser } from 'store/actions';
import { Store, CallingAction, MiddlewarePlacement, dispatchify } from 'aurelia-store';

function lastCalledActionMiddleware(state: IState, originalState: IState, settings = {}, action: CallingAction) {
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
    private state: IState;

  constructor(
    private ea: EventAggregator,
    private store: Store<IState>
) {
    this.store.registerMiddleware(lastCalledActionMiddleware, MiddlewarePlacement.After);
}

bind() {
    this.store.state.subscribe((s: IState) => {
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
        dispatchify(getMarketMakerUser)();
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
            route: ["", "home"],
            name: "home",
            moduleId: PLATFORM.moduleName("./routes/home/home", "home"),
            nav: false,
            title: "Home",
        },
        {
            route: "dashboard/:symbol?/:transactionType?",
            name: "dashboard",
            moduleId: PLATFORM.moduleName("./routes/dashboard/dashboard"),
            nav: false,
            title: "Dashboard",
        },
        {
            route: "wallet",
            name: "wallet",
            moduleId: PLATFORM.moduleName("./routes/wallet/wallet"),
            nav: false,
            title: "Wallet",
        },
        {
            route: "wallet/:symbol",
            name: "walletTokenDetail",
            moduleId: PLATFORM.moduleName(
                "./routes/wallet/wallet-token-detail/wallet-token-detail"
            ),
            nav: false,
            title: "Wallet Detail",
        },
        {
            route: "trades/:symbol?/:page?",
            name: "trades",
            moduleId: PLATFORM.moduleName("./routes/trades/trades"),
            nav: false,
            title: "trades",
        },
        {
            route: "maintenance",
            name: "maintenance",
            moduleId: PLATFORM.moduleName("./routes/maintenance/maintenance"),
            nav: false,
            title: "We will be right back...",
        },
        {
            route: "pricing",
            name: "pricing",
            moduleId: PLATFORM.moduleName("./routes/pricing/pricing", "pricing"),
            nav: false,
            title: "Pricing",
        },
        {
            route: "faq",
            name: "faq",
            moduleId: PLATFORM.moduleName("./routes/faq/faq", "faq"),
            nav: false,
            title: "Faq",
        },
        {
            route: "send/:symbol?",
            name: "send",
            moduleId: PLATFORM.moduleName("./routes/send/send"),
            nav: false,
            title: "send",
        },
        {
            route: "receive/:symbol?",
            name: "receive",
            moduleId: PLATFORM.moduleName("./routes/receive/receive"),
            nav: false,
            title: "receive",
        },
        {
            route: "login",
            name: "login",
            moduleId: PLATFORM.moduleName("./routes/login/login", "login"),
            nav: false,
            title: "Login",
        },
        {
            route: "market-maker",
            name: "marketMaker",
            moduleId: PLATFORM.moduleName("./routes/market-maker/market-maker-landing", "market-maker-landing"),
            nav: false,
            title: "Market Maker",
        },
        {
            route: "register-market-maker",
            name: "registerMarketMaker",
            moduleId: PLATFORM.moduleName("./routes/market-maker/register/register-market-maker", "register-market-maker"),
            nav: false,
            title: "Register Market Maker",
        },
        {
            route: "update-market-maker/:symbol?",
            name: "updateMarketMaker",
            moduleId: PLATFORM.moduleName("./routes/market-maker/update/update-market-maker", "update-market-maker"),
            nav: false,
            title: "Update Market Maker",
        },
        {
            route: "market-maker-dashboard",
            name: "marketMakerDashboard",
            moduleId: PLATFORM.moduleName("./routes/market-maker/dashboard/market-maker-dashboard", "market-maker-dashboard"),
            nav: false,
            title: "Market Maker Dashboard",
        },
        {
            route: "set-market-maker",
            name: "setMarketMaker",
            moduleId: PLATFORM.moduleName("./routes/market-maker/settings/settings", "set-market-maker"),
            nav: false,
            title: "Settings - Market Maker",
        },
    ]);

    this.router = router;
}
}
