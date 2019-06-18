const { renderHook, act } = require('react-hooks-testing-library');
const { BehaviorSubject, from } = require('rxjs');
const { reduce, take } = require('rxjs/operators');
const useEpicModule = require('..');
const { useEpic } = useEpicModule;

describe('useEpic()', () => {
  test('useEpic should be the default export', () => {
    expect(useEpicModule.default).toBe(useEpic);
  });

  test('it should subscribe to the observable returned from the epic', async () => {
    const subject = new BehaviorSubject({ foo: 'pre' });
    const { result } = renderHook(() => useEpic(() => subject));
    let [state] = result.current;
    expect(state.foo).toBe('pre');
    act(() => {
      subject.next({ foo: 'bar' });
    });
    state = result.current[0];
    expect(state.foo).toBe('bar');
  });

  test('it should provide a stream of dispatched actions to the epic as the first argument', done => {
    const clicks = from([1, 2, 3, 4]);
    const { result } = renderHook(() =>
      useEpic(actions$ => {
        actions$
          .pipe(
            take(4),
            reduce((acc, click) => [...acc, click], [])
          )
          .subscribe(clicks => {
            expect(clicks).toEqual([1, 2, 3, 4]);
            done();
          });
      })
    );
    let [, dispatch] = result.current;
    clicks.subscribe(action => dispatch(action));
  });

  test('it should provide a observable of the current state to the epic as the second argument', done => {
    const subject = new BehaviorSubject(1);
    renderHook(() =>
      useEpic(($actions, state$) => {
        state$
          .pipe(reduce((acc, click) => [...acc, click], []))
          .subscribe(clicks => {
            expect(clicks).toEqual([undefined, 1, 2, 3]);
            done();
          });
        return subject;
      })
    );
    act(() => {
      subject.next(2);
      subject.next(3);
      subject.complete();
    });
  });
});
