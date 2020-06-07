import { PLATFORM } from 'aurelia-pal';
import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    PLATFORM.moduleName('./value-converters/auth-filter'),
    PLATFORM.moduleName('./value-converters/to-fixed'),
    PLATFORM.moduleName('./value-converters/usd-format')
  ]);
}
