import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  useLayoutEffect,
} from 'react';
import { Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, catchError, tap } from 'rxjs/operators';
export * from './operators';

const DEFAULT_DEPS = {};

const EpicDependencyContext = createContext(DEFAULT_DEPS);
export const EpicDependencyProvider = ({ value = DEFAULT_DEPS, children }) => {
  return (
    <EpicDependencyContext.Provider value={value}>
      {children}
    </EpicDependencyContext.Provider>
  );
};

export const useEpic = (epic, inputs = [], dependencies = DEFAULT_DEPS) => {
  // dependencies
  const providedDeps = useContext(EpicDependencyContext);
  const depsRef = useRef(dependencies);
  const deps = useMemo(() => ({ ...providedDeps, ...depsRef.current }), [
    providedDeps,
  ]);

  // state
  const [state, setState] = useState(deps.initialState);
  const state$ = useMemo(
    () =>
      new BehaviorSubject(state).pipe(
        tap(state => {
          setState(state);
        }),
        catchError(err => {
          // What should we do on error?
          throw err;
        })
      ),
    []
  );

  // actions
  const actions$ref = useRef(new Subject());
  const actions$ = actions$ref.current;
  const dispatch = useCallback(action => actions$.next(action), [actions$]);

  // new state
  const createNewStateObservable = useCallback(epic, inputs);
  const newState$ = useMemo(() => {
    const newState$ = createNewStateObservable(
      actions$,
      state$.asObservable(),
      deps
    );
    return (
      newState$ && newState$.pipe(distinctUntilChanged()).subscribe(state$)
    );
  }, [createNewStateObservable, actions$, state$, deps]);

  useLayoutEffect(() => {
    if (!newState$) {
      // TODO: check for obsevable type and give warnings if not
      return;
    }
    const subscription = state$.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [newState$, setState]);

  return [state, dispatch];
};

export default useEpic;
