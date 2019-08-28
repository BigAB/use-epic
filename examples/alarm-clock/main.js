import React from 'react';
import ReactDOM from 'react-dom';
import { of, interval, concat } from 'rxjs';
import {
  takeWhile,
  takeUntil,
  scan,
  startWith,
  repeatWhen,
  share,
} from 'rxjs/operators';
import { useEpic, ofType } from 'use-epic';
import './styles.css';

function alarmClockEpic(action$) {
  const snooze$ = action$.pipe(ofType('snooze'));
  const dismiss$ = action$.pipe(ofType('dismiss'));

  const alarm$ = concat(
    interval(250).pipe(
      startWith(5),
      scan(time => time - 1),
      takeWhile(time => time > 0)
    ),
    of('Wake up! 🎉')
  ).pipe(share());

  const snoozableAlarm$ = alarm$.pipe(
    repeatWhen(() => snooze$.pipe(takeUntil(dismiss$)))
  );

  return concat(snoozableAlarm$, of('Have a wonderful day! 🤗'));
}

function App() {
  const [display, dispatch] = useEpic(alarmClockEpic);
  const snooze = () => dispatch('snooze');
  const dismiss = () => dispatch('dismiss');

  return (
    <>
      <div className='display'>{display}</div>
      <button onClick={snooze} className='snooze'>
        Snooze
      </button>
      <button onClick={dismiss} className='dismiss'>
        Dismiss
      </button>
    </>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
