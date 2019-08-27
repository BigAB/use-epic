import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { BehaviorSubject, Subject } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import useEpicModule, { useEpic, EpicDepsProvider, ofType } from '../src/main';

describe('useEpic()', () => {
  test('useEpic should be the default export (as well as named export)', () => {
    expect(useEpicModule).toBe(useEpic);
  });

  test('it should subscribe to the state observable returned from the epic', async () => {
    // ARRANGE
    const subject = new BehaviorSubject({ foo: 'bar' });
    const { result, waitForNextUpdate } = renderHook(() =>
      useEpic(() => subject.asObservable())
    );
    const [initialState] = result.current;
    let nextState, lastState;

    // ACT
    await act(async () => {
      subject.next({ foo: 'baz' });
      await waitForNextUpdate();
      nextState = result.current[0];
      subject.next({ foo: 'xop' });
      // await waitForNextUpdate(); // confused why this breaks test with timeout
      lastState = result.current[0];
    });

    // ASSERT
    expect(initialState.foo).toBe('bar');
    expect(nextState.foo).toBe('baz');
    expect(lastState.foo).toBe('xop');
  });

  test('if the onservable returned from the epic immediatly emits state, state should be available immediatly for the component', async () => {
    // ARRANGE
    const subject = new BehaviorSubject({ foo: 'pre' }); // Observable with state

    // ACT
    const { result } = renderHook(() => useEpic(() => subject));

    let [state] = result.current;

    // ASSERT
    expect(state.foo).toBe('pre');
  });

  test('it should provide a stream of dispatched actions to the epic as the first argument', () => {
    // ARRANGE
    const epicStub = jest.fn();

    const { result } = renderHook(() => useEpic(epicStub));

    // get the observable passed to the epicStub as the first argument
    const action$ = epicStub.mock.calls[0][0];

    let expected; // to be assigned after 4th action
    // an observable stream that will wait for 4 actions and then
    // assign those actions as an array to the expected variable
    action$
      .pipe(
        take(4),
        toArray()
      )
      .subscribe(values => (expected = values));

    // ACT
    const [, dispatch] = result.current;
    act(() => {
      dispatch(1);
      dispatch(2);
      dispatch(3);
      dispatch(4);
    });

    // ASSERT
    expect(expected).toEqual([1, 2, 3, 4]);
  });

  test('it should provide a observable of the current state to the epic as the second argument', () => {
    // ARRANGE
    const subject = new BehaviorSubject(1);
    const epicStub = jest.fn(() => subject); // epicStub returns the subject
    renderHook(() => useEpic(epicStub));

    // get the observable passed to the epicStub as the second argument
    const state$ = epicStub.mock.calls[0][1];

    let expected; // to be assigned after 4th action
    // an observable stream that will wait for 4 actions and then
    // assign those actions as an array to the expected variable
    const stateChanges$ = state$.pipe(
      take(4),
      toArray()
    );

    // ACT
    act(() => {
      // the behaviour starts with a stateful 1 state when subscribed
      stateChanges$.subscribe(values => (expected = values));

      subject.next(2);
      subject.next(3);
      subject.next(4);
    });

    // ASSERT
    expect(expected).toEqual([1, 2, 3, 4]);
  });

  test('it should unsubscribe from the observable returned by the epic when the component is unmounted', async () => {
    // ARRANGE
    const subject = new BehaviorSubject(1);
    const epicStub = jest.fn(() => subject); // epicStub returns the subject
    const { result, unmount, waitForNextUpdate } = renderHook(() =>
      useEpic(epicStub)
    );

    // ACT
    await act(async () => {
      subject.next(2);
      await waitForNextUpdate();
      unmount();
      subject.next(3);
      subject.next(4);
    });

    // ASSERT
    expect(result.current[0]).toEqual(2);
    expect(subject.observers.length).toBe(0);
  });

  test('options.deps values passed to useEpic will be provided to the epic in an object as the third argument', async () => {
    // ARRANGE
    const expected = function someDep() {};
    const epicStub = jest.fn();
    // ACT
    renderHook(() => useEpic(epicStub, { deps: { expected } }));

    // ASSERT
    expect(epicStub.mock.calls[0][2].expected).toBe(expected);
  });

  test('options.props values passed to use epic will emit to a special deps.props$ observable', async () => {
    // ARRANGE
    const initialProps = { count: 1 };
    const epicStub = jest.fn();
    const { rerender, waitForNextUpdate } = renderHook(
      props => {
        return useEpic(epicStub, { props: props.count });
      },
      {
        initialProps,
      }
    );
    const props$ = epicStub.mock.calls[0][2].props$;
    let expected;
    props$
      .pipe(
        take(4),
        toArray()
      )
      .subscribe(values => (expected = values));

    // ACT
    await act(async () => {
      rerender({ count: 2 });
      await waitForNextUpdate();
      rerender({ count: 3 });
      // await waitForNextUpdate(); // confused why this breaks test with timeout
      rerender({ count: 4 });
      // await waitForNextUpdate(); // ditto
    });

    // ASSERT
    expect(expected).toEqual([1, 2, 3, 4]);
  });

  test('it should warn and do nothing if the epic returns something other than undefined or an observable', async () => {
    // ARRANGE
    const epicStub = jest.fn(() => []);
    const origWarn = console.warn;
    console.warn = jest.fn();

    // ACT
    renderHook(() => useEpic(epicStub));

    // ASSERT
    expect(console.warn.mock.calls[0][0]).toBe(
      'use-epic: Epic returned something that was not an RXJS observable'
    );

    // CLEANUP
    console.warn = origWarn;
  });

  test.skip('Should just throw any errors emitted from the observable returned by useEpic', () => {
    // ARRANGE
    const theError = new Error('Something has gone very very wrong');
    const subject = new BehaviorSubject();
    const epicStub = jest.fn(() => subject);
    const { result } = renderHook(() => useEpic(epicStub));

    // ACT
    act(() => {
      subject.error(theError);
    });

    // ASSERT
    expect(result.error).toBe(theError);
  });
});

describe('<EpicDepsProvider>', () => {
  test('Any props passed to <EpicDepsProvider> will be passed along to the epics third argument', () => {
    // ARRANGE
    const epicStub = jest.fn();
    const someDep = jest.fn();
    const anotherDep = jest.fn();
    const Provider = ({ children }) =>
      React.createElement(
        EpicDepsProvider,
        {
          someDep: someDep,
          another: anotherDep,
        },
        children
      );

    // act
    renderHook(() => useEpic(epicStub), {
      wrapper: Provider,
    });

    // get the deps object passed to the epicStub as the third argument
    const deps = epicStub.mock.calls[0][2];

    // ASSERT
    expect(deps.someDep).toBe(someDep);
    expect(deps.another).toBe(anotherDep);
  });

  test('Props passed to <EpicDepsProvider> will be merged with option.deps passed in useEpic', () => {
    // ARRANGE
    const epicStub = jest.fn();
    const someDep = jest.fn();
    const anotherDep = jest.fn();
    const Provider = ({ children }) =>
      React.createElement(
        EpicDepsProvider,
        {
          someDep: someDep,
        },
        children
      );

    // act
    renderHook(() => useEpic(epicStub, { deps: { anotherDep } }), {
      wrapper: Provider,
    });

    // get the deps object passed to the epicStub as the third argument
    const deps = epicStub.mock.calls[0][2];

    // ASSERT
    expect(deps.someDep).toBe(someDep);
    expect(deps.anotherDep).toBe(anotherDep);
  });
});

describe('ofType()', () => {
  test('filters actions based on action, action.type, or if action is an array [type, payload]', () => {
    // ARRANGE
    const subject = new Subject();
    const result = subject.pipe(
      take(9),
      ofType('someType'),
      toArray()
    );
    let expected;
    result.subscribe(values => (expected = values));

    // ACT
    subject.next('someType');
    subject.next('wrongType');
    subject.next({ type: 'someType', payload: 1 });
    subject.next({ type: 'wrongType', payload: 2 });
    subject.next({ type: 'someType', payload: 3 });
    subject.next({ type: 'XXXXXXXX', payload: 4 });
    subject.next({ payload: 5 });
    subject.next(['someType', 6]);
    subject.next(['nope', 7]);

    // ASSERT
    expect(expected).toEqual([
      'someType',
      { type: 'someType', payload: 1 },
      { type: 'someType', payload: 3 },
      ['someType', 6],
    ]);
  });
});
