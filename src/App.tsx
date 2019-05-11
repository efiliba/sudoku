import React, {useState} from 'react';
import solver from "./solver";
import {Grid, IGridSelection} from './components';
import './App.scss';

solver.Grid.Constructor(2, 2);
const grid = new solver.Grid();

const App: React.FC = () => {
  const [data, setGridData] = useState(grid.toJson());
  
  const handleSelection = ({button, modifiers, subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow}: IGridSelection) => {
    grid.fixByPosition(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
    grid.simplify();
    // grid.solve();
    setGridData(grid.toJson());
  };

  return (
    <div className="board">
      <Grid data={data} onSelection={handleSelection} />
    </div>
  );
}

export default App;
