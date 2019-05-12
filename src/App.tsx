import React, {useState} from 'react';
import solver from "./solver";
import {Grid, IGridSelection, Legend} from './components';
import './App.scss';

solver.Grid.Constructor(2, 2);
const grid = new solver.Grid();
// grid.fixByPosition(0, 0, 0, 0, 0, 0);
// grid.fixByPosition(0, 0, 1, 1, 1, 0);
// grid.fixByPosition(1, 1, 0, 0, 0, 1);
// grid.fixByPosition(1, 1, 1, 1, 1, 1);

const App: React.FC = () => {
  const [data, setGridData] = useState(grid.toJson());
  
  const handleSelection = ({button, modifiers, subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow, symbol}: IGridSelection) => {
    // grid.fixByPosition(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
    grid.setBySymbol(subGridColumn, subGridRow, cellColumn, cellRow, symbol);
    grid.simplify();
    // grid.solve();
    // grid.debug();
    // console.log(grid.toJson());
    setGridData(grid.toJson());
  };

  return (
    <div className="board">
      <Grid data={data} onSelection={handleSelection} />
      <Legend />
    </div>
  );
}

export default App;
