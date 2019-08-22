import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useLayoutEffect,
} from 'react';
import { Subject, BehaviorSubject, EMPTY, isObservable } from 'rxjs';
import { distinctUntilChanged, catchError, tap } from 'rxjs/operators';
export * from './operators';

const DEFAULT_DEPS = {};

const EpicDependencyContext = createContext(DEFAULT_DEPS);
export const EpicDependencyProvider = ({ value = DEFAULT_DEPS, children }) => {
  return React.createElement(
    EpicDependencyContext.Provider,
    {
      value: value,
    },
    children
  );
};

export const useEpic = (
  epic,
  { props, deps: dependencies = DEFAULT_DEPS } = {}
) => {
  // props
  const props$ref = useRef(props);
  const props$ = useMemo(
    () => new BehaviorSubject(props$ref.current).pipe(distinctUntilChanged()),
    [props$ref]
  );
  props$.next(props);

  // dependencies
  const providedDeps = useContext(EpicDependencyContext);
  const depsRef = useRef(dependencies);
  const depsCheck = useMemo(
    () => ({ ...providedDeps, ...depsRef.current, props$ }),
    [providedDeps, props$]
  );
  // Only recreate deps if any shallow value changes
  // eslint-disable-next-line
  const deps = useMemo(() => depsCheck, Object.values(depsCheck));

  // state
  const [state, setState] = useState();
  const stateRef = useRef(state);
  const state$ = useMemo(() => {
    return new BehaviorSubject(stateRef.current).pipe(
      tap(state => {
        setState(state);
      }),
      catchError(err => {
        // What should we do on error?
        throw err;
      })
    );
  }, [stateRef, setState]);
  // subscribe to state$ immediatly, but unsubscribe on unmount
  useLayoutEffect(() => {
    const sub = state$.subscribe();
    return () => sub.unsubscribe();
  }, [state$]);

  // actions
  const actions$ref = useRef(new Subject());
  const actions$ = actions$ref.current;
  const dispatch = useCallback(action => actions$.next(action), [actions$]);

  // new state
  const epicRef = useRef(epic);
  const newState$ = useMemo(() => {
    const newState$ = epicRef.current(actions$, state$.asObservable(), deps);
    if (newState$ && !isObservable(newState$)) {
      if ('production' !== process.env.NODE_ENV) {
        // eslint-disable-next-line no-console
        console.warn(
          'use-epic: Epic did not returned something that was not an RXJS observable'
        );
      }
      return EMPTY;
    }
    return newState$ || EMPTY;
  }, [epicRef, actions$, state$, deps]);
  const subscription = useMemo(
    () => newState$.pipe(distinctUntilChanged()).subscribe(state$),
    [newState$, state$]
  );

  useLayoutEffect(() => () => subscription.unsubscribe(), [subscription]);

  return [state, dispatch];
};

export default useEpic;
