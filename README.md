# 🏰 use-epic

[![Build Status](https://travis-ci.org/bigab/use-epic.svg?branch=master)](https://travis-ci.org/bigab/use-epic)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/bigab/use-epic/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/use-epic.svg)](https://badge.fury.io/js/use-epic) [![Greenkeeper badge](https://badges.greenkeeper.io/BigAB/use-epic.svg)](https://greenkeeper.io/)

Use RxJS Epics as state management for your React Components

### What is an **Epic**❓

An **Epic** is a function which takes an Observable of actions (`action$`), an Observable of the current state (`state$`), and an object of dependencies (`deps`) and returns an Observable.

The idea of the **Epic** comes out of the fantastic redux middleware [redux-observable](https://redux-observable.js.org/), but a _noteable difference_ is that, because redux-observable is redux middleware, the observable returned from the **Epic** emits new `actions` to be run through **reducers** to create new state, `useEpic()` skips the redux middleman and expects the
**Epic** to return an observable of `state` updates.

```js
function Epic(action$, state$, deps) {
  return newState$;
}
```

This simple idea opens up all the fantastic abilites of [RxJS](https://rxjs.dev/) to your React components with a simple but powerful API.

## :mag_right: Usage

```js
function productEpic(action$, state$, deps) {
  const { productStore, cartObserver, props$ } = deps;
  combineLatest(action$.pipe(ofType('addToCart')), state$)
    .pipe(
      map(([productId, products]) => products.find(p => p.id === productId))
    )
    .subscribe(cartObserver);

  return props$.pipe(
    map(props => props.category),
    switchMap(category => productStore.productsByCategory(category)),
    startWith([])
  );
}

const ProductsComponent = props => {
  const [products, dispatch] = useEpic(productEpic, { props });

  // map dispatch to a component callback
  const addToCart = productId =>
    dispatch({ type: 'addToCart', payload: productId });

  return <ProductsList products={products} addToCart={addToCart} />;
};
```

## :hammer_and_pick: Installation

`use-epic` requires both `react` and `rxjs` as **peer dependencies**.

```sh
npm install use-epic rxjs react
```

```sh
yarn add use-epic rxjs react
```

## :card_file_box: Examples

- [Simple Fetch Example] _\*coming soon\*_
- [Snooze Timer] _\*coming soon\*_
- [Beer Search] _\*coming soon\*_
- [Pull to Refresh] _\*coming soon\*_
- [Working with simple-store] _\*coming soon\*_

## :book: API

- [`useEpic()`](#useepic)
- [`epic`](#epic)
- [`ofType`](#oftype)
- [`<EpicDepsProvider>`](#epicdepsprovider)

### `useEpic()`

A [React hook](https://reactjs.org/docs/hooks-intro.html) for using RxJS Observables for state management.

#### `const [state, dispatch] = useEpic( Epic, options* );`

The `useEpic()` hook, accepts an `Epic` function, and an `options` object, and returns a tuple of `state` and a `dispatch` callback, similar to [`useReducer()`](https://reactjs.org/docs/hooks-reference.html#usereducer).

**arguments**

- `Epic` an [Epic](#Epic) function, [described below](#Epic) .

  `function myEpic( action$, state$, deps ) { return newState$ }`

  It should be noted, that only the first Epic function passed to `useEpic()` will be retained, so if you write your function inline like:

  ```js
  const [state] = useEpic((action$, state$, deps) => {
    return action$.pipe(switchMap(action => fetchData(action.id)));
  });
  ```

  ...any variable closures used in the epic will not change, and component renders will generate a new `Epic` function that will merely be discared. For that reason we encourage defining Epics outside of the component.

- `options` <sup>_\*optional_</sup> an object with some special properties:
  - `deps` - an object with keys, any key/values on this deps object will be available on the `deps` argument in the `Epic` function
  - `props` - a way to "pass" component props into the `Epic`, anything passed here will be emitted to the special, always available, `deps.props$`, in the `Epic`. This should be used with caution, as it limits portability, but is available for when dispatching an action is not appropriate.

```js
const CatDetails = props => {
  const [cat] = useEpic(kittenEpic, { deps: { kittenService }, props: cat.id });
  <Details subject={cat} />;
};
```

### `epic()`

An **`Epic`** is a function, that accepts an Observable of actions (`action$`), an Observable of the current state (`state$`), and an object of dependencies (`deps`) and returns an Observable of `stateUpdates$`.

#### `function myEpic( action$*, state$*, deps* ) { return newState$* }`

All arguments are optional, and it may either return a new [RxJS Observable](https://rxjs.dev/api/index/class/Observable) or `undefined`. If an observable is returned, and values emitted from that observable are set as `state` and returned as the first tuple element from `useEpic()`.

**arguments**

- `action$` <sup>_\*optional_</sup> An observable of dispatched `actions`. The `actions` emitted are anything passed to the `dispatch()` callback returned from `useEpic()`. They can be anything, but by convention are often either objects with a `type`, `payload` and sometimes `meta` properties (e.g. `{ type: 'activate', payload: user }`), or an array tuple with the `type` as the first element and the payload as the second (e.g. `['activate', user]`).

- `state$` <sup>_\*optional_</sup> An observable of the current `state`. It can be sometimes helpful to have a reference to the current state when composing streams, say if your `action.payload` is an `id` and you'd like to map that to a state entity before further processing it. Unless the observable returned from `useEpic()` has initial state, from using `startWith()` or a `BehaviorSubject`, this will emit `undefined` to start.  
   ⚠️ Caution: When using `state$` it is possible to find yourself in an inifinte asynchrnous loop. Take care in how it is used along with the returned `newState$` observable.

- `deps` <sup>_\*optional_</sup> an object of key/value pairs provided by the `options` of `useEpic` when it is called, or from the `<EpicDepsProvider>` component.

  The `deps` argument can be very useful for provding a dependency injection point into your `Epic`s and therefore into your components. For example, if you provide an `ajax` dependecy in deps, you could provide the RxJS `ajax` function by default, but stub out `ajax` for tests or demo pages by wrapping your component in an `<EpicDepsProvider>` component.

  ```js
    const kittyEpic = (action$, state$, { ajax: rxjs.ajax }) => {
      return action$.pipe(
        switchMap(({ payload: id })=> ajax(`/api/kittens/${id}`))
      );
    }

    const KittyComponent = () => {
      const [kitty, dispatch] = useEpic(kittyEpic);

      //... render and such
    }

    // mocking for tests
    test('should load kitty details when clicked', async () => {
      // stub out ajax for the test
      const fakeResponse = { name: 'Snuggles', breed: 'tabby' };
      const ajaxStub = jest.fn(() => Promise.resolve(fakeResponse));

      const { getByLabelText, getByText } = render(
        <EpicDepsProvider ajax={ajaxStub}>
          <KittyComponent />
        </EpicDepsProvider>
      );

      fireEvent.click(getByLabelText(/Cat #1/i));
      const detailsName = await getByText(/^Name:/);
      expect(detailsName.textContent).toBe('Name: Snuggles')
    });
  ```

  The `deps` object can be good for providing "services", config, or any number of other useful features to help decouple your components from their dependecies.

  `props$`  
  There is a special property `deps.props$` which is always provided by `useEpic()` and is the methods in which components can pass props into the Epic. The `options.props` property of the `useEpic()` call is always emitted to the `deps.props$` observable.

### `ofType()`

A [RxJS Operator](https://rxjs.dev/guide/operators) for convient filtering of action\$ by `type`

#### `action$.pipe( ofType( type, ...moreTypes* ) );`

Just a convinience operator for filtering `actions` by type, from either the conventional object form `{ type: 'promote', payload: { id: 23 } }` or array form `['promote', { id: 23 }]`. The `ofType()` operator only filters, so your `type` property will still be in the emitted value for the next operator or subscription.

**arguments**

- `type` the `ofType()` operator can take one or more `type` arguments to match on, if any of the `types` match for the action emitted, the `action` will be emitted further down the stream. The `type` arguments are not restriced to `Strings`, they can be anything including symbols, functions or objects. They are matched with SameValueZero (pretty much `===`) comparison.

```js
const promotionChange$ = action$.pipe(ofType('promote', 'depromote'));
```

### `<EpicDepsProvider>`

A React Provider component that supplies `deps` to any `epic` function used by the `useEpic()` hook, called anywhere lower in the component tree, just like Reacts [`context.Provider`](https://reactjs.org/docs/context.html#contextprovider)

```jsx
<EpicDepsProvider kittenService={kittenService} catConfig={config}>
  <App />
</EpicDepsProvider>

// const kittyEpic = ( action$, state$, { kittenService, catConfig }) => {
//  ...
// }
```

Any `props` passed to the `EpicDepsProvider` component will be merged onto the `deps` object passed to the `epic` function when calling `useEpic()`. Any change in `deps` will unsubscribe from the `newState$` observable, and recall the `epic` function, setting up new subscriptions, so try to change `deps` sparingly.

## Testing

One benefit of using Epics for state management is that they are easy to test. Because they are just functions, you can ensure the behaviour of your Epic, just by calling it with some test observables and deps, emitting actions, and asserting on the `newState$` emitted.

_TODO: Create testing example_  
_TODO: Create epic testing helper method_

## :seedling: Contribute

Think you'd like to contribute to this project? Check out our [contributing guideline](./CONTRIBUTING.md) and feel free to create issues and pull requests!

## License

MIT © [Adam L Barrett](./LICENSE)
