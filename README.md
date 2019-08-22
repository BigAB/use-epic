# :rocket: use-epic

[![Build Status](https://travis-ci.org/bigab/use-epic.svg?branch=master)](https://travis-ci.org/bigab/use-epic)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/bigab/use-epic/blob/master/LICENSE)
[![npm version](https://badge.fury.io/js/use-epic.svg)](https://badge.fury.io/js/use-epic)

Use RxJS Epics as state management for your React Components

## :book: Contents

- [Usage](#mag_right-usage)
- [Installation](#hammer_and_pick-installation)
- [Contribute](#seedling-Contribute)

## :mag_right: Usage

```js
const ProductsComponent = props => {
  const [products, dispatch] = useEpic((action$, state$, deps) => {});

  return <ProductsList />;
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

## :seedling: Contribute

Let people know how they can contribute into your project. A [contributing guideline](./CONTRIBUTING.md) will be a big plus.

## License

MIT © [Adam L Barrett](./LICENSE)
