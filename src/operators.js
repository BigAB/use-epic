import { pipe } from 'rxjs';
import { filter } from 'rxjs/operators';
// similar to https://github.com/redux-observable/redux-observable/blob/master/src/operators.js

export const ofType = (...keys) =>
  pipe(
    filter(
      action =>
        keys.includes(action.type) ||
        (Array.isArray(action) && keys.includes(action[0]))
    )
  );
