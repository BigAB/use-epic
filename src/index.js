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
import { distinctUntilChanged, tap } from 'rxjs/operators';

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
  const state$ref = useRef(new BehaviorSubject(state));
  const state$ = useMemo(
    () =>
      state$ref.current.pipe(
        distinctUntilChanged(),
        tap(s => setState(s))
      ),
    [state$ref, setState]
  );

  // actions
  const actions$ref = useRef(new Subject());
  const actions$ = actions$ref.current;
  const dispatch = useCallback(action => actions$.next(action), [actions$]);

  // new state
  const createNewStateObservable = useCallback(epic, inputs);
  const newState$ = useMemo(
    () => createNewStateObservable(actions$, state$, deps),
    [createNewStateObservable, actions$, state$, deps]
  );

  useLayoutEffect(() => {
    const subscription = newState$.subscribe(state$);

    return () => {
      subscription.unsubscribe();
    };
  }, [state$, newState$]);

  return [state, dispatch];
};

export default useEpic;
