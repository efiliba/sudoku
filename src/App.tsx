import React, {useState, useEffect} from 'react';
import './App.scss';

import solver from "./solver";

import {Grid} from './components';


solver.Grid.Constructor(2, 2);
const grid = new solver.Grid();

const App: React.FC = () => {
  const [data, setGridData] = useState(grid.toJson());

  const update = () => {
    // debugger
    grid.setByOption(0, 0, 0, 0, 1);       // Set (top left) top left cell to 1
    grid.setByOption(0, 1, 0, 0, 2);       // Set (bottom left) top left cell to 2
    grid.setByOption(1, 0, 0, 1, 4);       // Set (top right) bottom left cell to 3
    // grid.setByOption(1, 1, 1, 1, 8);
    // grid.solve();

    // console.log(grid.toJson());
    // debugger;
    setGridData(grid.toJson());
  }

  // useEffect(update, []);

  return (
    <div className="App">
      <header className="App-header">
        <Grid data={data} />
        <button onClick={update}>Load</button>
      </header>
    </div>
  );
}

export default App;
