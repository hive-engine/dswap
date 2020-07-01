import { Container } from 'aurelia-framework';
import { Store } from 'aurelia-store';
import { first } from 'rxjs/operators';

const store: Store<IState> = Container.instance.get(Store) as Store<IState>;

export async function getStateOnce(): Promise<IState> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        store.state.pipe(first()).subscribe((state: IState) => resolve(state), (e) => reject(e));
    });
}

export const getCurrentState = () => (store as any)._state.getValue() as IState;

export default store;
