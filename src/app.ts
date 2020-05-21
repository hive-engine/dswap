import { PLATFORM } from 'aurelia-pal';
import { Router, RouterConfiguration } from 'aurelia-router';
import { environment } from 'environment';
import { MaintenanceStep } from 'resources/pipeline-steps/maintenance';
import { AuthorizeStep } from 'resources/pipeline-steps/authorize';
import { PreRenderStep } from 'resources/pipeline-steps/prerender';
import { PostRenderStep } from 'resources/pipeline-steps/postrender';
export class App {
  public message: string = 'Hello World!';

  public router: Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = environment.siteName;

    console.log('hello');

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
            nav: 4,
            title: 'Faq',
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
