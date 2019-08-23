# 🏰 use-epic

[![Build Status](https://travis-ci.org/bigab/use-epic.svg?branch=master)](https://travis-ci.org/bigab/use-epic)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/bigab/use-epic/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/use-epic.svg)](https://badge.fury.io/js/use-epic) [![Greenkeeper badge](https://badges.greenkeeper.io/BigAB/use-epic.svg)](https://greenkeeper.io/)

Use RxJS Epics as state management for your React Components

## :mag_right: Example

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

## :book: API

### `useEpic()`

TODO

## :seedling: Contribute

Think you'd like to contribute to this project? Check out our [contributing guideline](./CONTRIBUTING.md) and feel free to create issues and pull requests!

## License

MIT © [Adam L Barrett](./LICENSE)
