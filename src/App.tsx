import React, {useState} from 'react';
import solver from "./solver";
import {Grid, ModifierKeys, IGridSelection, Legend} from './components';
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
    switch (modifiers) {
      case ModifierKeys.NONE:
        grid.setByPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.SHIFT:
        grid.strikeOutAtPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.CONTROL:
        grid.pencilInAtPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.OPTION:
        grid.setBySymbol(subGridColumn, subGridRow, cellColumn, cellRow, symbol);
        break;
      case ModifierKeys.COMMAND:
        grid.removeOptionAtPosition(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
    }

    grid.simplify();
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
