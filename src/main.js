import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useContext,
  useEffect,
} from 'react';
import { Subject, BehaviorSubject, EMPTY, isObservable } from 'rxjs';
import { distinctUntilChanged, catchError, tap } from 'rxjs/operators';
import { EpicDepsProvider, EpicDepsContext } from './provider';

export * from './operators';
export { EpicDepsProvider };

const DEFAULT_DEPS = {};

export const useEpic = (
  epic,
  { props, deps: dependencies = DEFAULT_DEPS } = {}
) => {
  // props
  const props$ref = useRef();
  if (!props$ref.current) {
    props$ref.current = new BehaviorSubject(props$ref.current).pipe(
      distinctUntilChanged()
    );
  }
  const props$ = props$ref.current;
  props$.next(props);

  // dependencies
  const providedDeps = useContext(EpicDepsContext);
  const depsCheck = useMemo(
    () => ({ ...providedDeps, ...dependencies, props$ }),
    [providedDeps, dependencies, props$]
  );
  // Only recreate deps if any shallow value changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deps = useMemo(() => depsCheck, Object.values(depsCheck));

  // state
  const [state, setState] = useState();
  const stateRef = useRef();
  if (!stateRef.current) {
    stateRef.current = new BehaviorSubject(stateRef.current).pipe(
      tap(state => {
        setState(state);
      }),
      catchError(err => {
        // TODO: What should we do on error?
        throw err;
      })
    );
  }
  const state$ = stateRef.current;
  // subscribe to state$ immediately, but unsubscribe on unmount
  useEffect(() => {
    const sub = state$.subscribe();
    return () => sub.unsubscribe();
  }, [state$]);

  // actions
  const actionsRef = useRef();
  if (!actionsRef.current) {
    actionsRef.current = new Subject();
  }
  const actions$ = actionsRef.current;
  const dispatch = useCallback(
    (...args) => {
      actions$.next(args.length > 1 ? args : args[0]);
    },
    [actions$]
  );

  // epics are not recomputed, only the first value passed is used
  const epicRef = useRef(epic);

  // new state observable is recomputed, every time deps change
  const newState$ = useMemo(() => {
    const newState$ = epicRef.current(
      actions$.asObservable(),
      state$.asObservable(),
      deps
    );
    if (newState$ && !isObservable(newState$)) {
      if ('production' !== process.env.NODE_ENV) {
        // eslint-disable-next-line no-console
        console.warn(
          'use-epic: Epic returned something that was not an RXJS observable'
        );
      }
      return EMPTY;
    }
    return newState$ || EMPTY;
  }, [actions$, state$, deps]);

  useEffect(() => {
    const subscription = newState$
      .pipe(distinctUntilChanged())
      .subscribe(state$);
    return () => subscription.unsubscribe();
  }, [newState$, state$]);

  return [state, dispatch];
};

export default useEpic;
