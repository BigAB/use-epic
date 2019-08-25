import React from 'react';
import ReactDOM from 'react-dom';
import { PeopleList } from './PeopleList';
import './styles.css';

function App() {
  return (
    <React.Fragment>
      <h1>use-epic</h1>
      <h2>A simple example of loading a list on mount</h2>
      <PeopleList />
    </React.Fragment>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
