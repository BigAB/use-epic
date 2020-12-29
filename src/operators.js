import { pipe, of } from 'rxjs';
import { filter, switchMap, map, pairwise } from 'rxjs/operators';
// similar to https://github.com/redux-observable/redux-observable/blob/master/src/operators.js

export const ofType = (...keys) =>
  pipe(
    filter(
      (action) =>
        keys.includes(action) ||
        keys.includes(action.type) ||
        (Array.isArray(action) && keys.includes(action[0]))
    )
  );

export const distinctUntilPropertyChanged = () =>
  pipe(
    switchMap((v, i) => (i === 0 ? of({}, v) : of(v))),
    pairwise(),
    filter(([prev, obj]) =>
      typeof obj === 'object'
        ? !(
            Object.keys(prev).every((k) => prev[k] === obj[k]) &&
            Object.keys(obj).every((k) => prev[k] === obj[k])
          )
        : prev !== obj
    ),
    map(([, v]) => v)
  );
