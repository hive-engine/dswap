import {Aurelia, LogManager} from 'aurelia-framework'
import { environment } from './environment';
import {PLATFORM} from 'aurelia-pal';
import { initialState } from './store/state';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'izitoast/dist/css/iziToast.css';
import './styles/toast.css';
import './styles/main.css';
import './styles/radio-toggles.css';

import modalCss from 'styles/modal.css';

import { TCustomAttribute } from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend';
import { EventAggregator } from 'aurelia-event-aggregator';
import { AppRouter } from 'aurelia-router';
import { ConsoleAppender } from 'aurelia-logging-console';

import Mousetrap from 'mousetrap';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/pro-solid-svg-icons';
import { far } from '@fortawesome/pro-regular-svg-icons';
import { fad } from '@fortawesome/pro-duotone-svg-icons';

import { I18N } from 'aurelia-i18n';
import { ValidationMessageProvider } from 'aurelia-validation';

import { authStateChanged } from './common/firebase';

LogManager.addAppender(new ConsoleAppender());

library.add(fas as any, far, fad);

import { getHivePrice } from 'common/functions';
// Gets the latest Hive price periodically
getHivePrice();
setInterval(() => getHivePrice, 300000);

export async function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName('resources/index'))
    .feature(PLATFORM.moduleName('components/index'))

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
  }

  aurelia.use.plugin(PLATFORM.moduleName('aurelia-animator-css'));
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-async-binding'));
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-validation'));
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-fontawesome'));

  aurelia.use.plugin(PLATFORM.moduleName('aurelia-store', 'store'), {
    initialState: initialState,
    history: {
        undoable: false,
        limit: 5
    }
});

aurelia.use.plugin(PLATFORM.moduleName('aurelia-dialog'), config => {
    config
        .useDefaults()
        .useCSS(modalCss.toString());
});

aurelia.use.plugin(PLATFORM.moduleName('aurelia-i18n'), (instance) => {
    const aliases = ['t', 'i18n'];
    TCustomAttribute.configureAliases(aliases);

    // register backend plugin
    instance.i18next
        .use(Backend);

    return instance.setup({
        backend: {
            loadPath: './locales/{{lng}}/{{ns}}.json',
        },
        attributes: aliases,
        //ns: ['translation', 'errors', 'buttons', 'notifications', 'titles'],
        ns: [],
        defaultNS: 'translation',
        lng: environment.defaultLocale,
        fallbackLng: 'en',
        debug: false
    }).then(() => {
        const router = aurelia.container.get(AppRouter);

        router.transformTitle = title => instance.tr(`titles:${title}`);

        const eventAggregator = aurelia.container.get(EventAggregator);
        eventAggregator.subscribe('i18n:locale:changed', () => {
            router.updateTitle();
        });
    });
});

    await authStateChanged();
    await aurelia.start();
    await aurelia.setRoot(PLATFORM.moduleName('app'));
}
