import { PLATFORM } from 'aurelia-pal';
import { FrameworkConfiguration } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
    config.globalResources([
        PLATFORM.moduleName('./receive-address/receive-address'),
        PLATFORM.moduleName('./swapnav/swapnav'),
        PLATFORM.moduleName('./nav-bar/nav-bar'),
        PLATFORM.moduleName('./nav-header/nav-header')
    ]);
}
