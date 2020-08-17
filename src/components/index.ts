import { PLATFORM } from 'aurelia-pal';
import { FrameworkConfiguration } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
    config.globalResources([
        PLATFORM.moduleName('./chart/chart'),
        PLATFORM.moduleName('./loader/loader'),
        PLATFORM.moduleName('./receive-address/receive-address'),
        PLATFORM.moduleName('./swapnav/swapnav'),
        PLATFORM.moduleName('./nav-bar/nav-bar'),
        PLATFORM.moduleName('./nav-bar/footer-nav-sm'),
        PLATFORM.moduleName('./nav-header/nav-header')
    ]);
}
