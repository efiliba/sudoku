import React from 'react';
import logo from './logo.svg';
import './App.css';

import { SetMethod } from "./solver/cell";
import { SubGrid } from "./solver/subGrid";

import { Cell } from './components';


// Cell.Constructor(2, 2);
SubGrid.Constructor(2, 2);

const test = () => {
  const subGrid = new SubGrid(0, 0);
  subGrid.setByPosition(0, 0, 0, 0, SetMethod.user);  // should have top left cell set
  
  subGrid.setByOption(1, 0, 2, SetMethod.loaded);
  subGrid.setByPosition(0, 1, 0, 1, SetMethod.loaded);
  
  subGrid.debug();
  subGrid.simplify(); // should be solved
  
  const t = subGrid.debug();
  console.log(t);
  debugger;
}

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <Cell options={5}/>

        <p>
          <button onClick={test}>Load</button>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
