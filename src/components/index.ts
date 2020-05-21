import { PLATFORM } from 'aurelia-pal';
import { FrameworkConfiguration } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
    config.globalResources([
        PLATFORM.moduleName('./dashboard/dashboard'),
        PLATFORM.moduleName('./receive-address/receive-address'),
        PLATFORM.moduleName('./swapnav/swapnav'),
        PLATFORM.moduleName('./trades/trades'),
        PLATFORM.moduleName('./transactions/transactions'),
        PLATFORM.moduleName('./wallet/wallet')
    ]);
}
