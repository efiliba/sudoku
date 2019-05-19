import React, {useState, useRef} from 'react';
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
  const fileRef = useRef(null);
  const loadedJson = useRef(null);

  const handleSelection = ({button, modifiers, subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow, symbol}: IGridSelection) => {
    const subGrid = grid.get(subGridColumn, subGridRow).get(subGridRow, cellColumn);
    if (subGrid.solved()) {
      subGrid.reset();
    } else

    switch (modifiers) {
      case ModifierKeys.NONE:
        grid.setByPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.SHIFT:
        grid.toggleStrikeOutAtPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.CONTROL:
        grid.togglePencilInAtPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
      case ModifierKeys.OPTION:
        grid.setBySymbol(subGridColumn, subGridRow, cellColumn, cellRow, symbol);
        break;
      case ModifierKeys.COMMAND:
        grid.removeOptionAtPosition(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
        break;
    }

    // grid.simplify();
    setGridData(grid.toJson());
  };

  const handleSave = () => console.log(JSON.stringify(data, null, 2));

  const handleLoad = () => fileRef.current.click();

  const handleSelectFile = async () => {
    const [file] = fileRef.current.files;
    const text = await (new Response(file)).text();
    loadedJson.current = JSON.parse(text);

    handleReset();
  };

  const handleReset = () => {
    grid.reset();
    if (loadedJson.current != null) {
      grid.setJson(loadedJson.current);
    }
    setGridData(grid.toJson());
  };

  const handleSolve = () => {
    const solved = grid.solve(true);
    setGridData(grid.toJson());

    console.log({solved, valid: grid.isValid()});
  };

  return (
    <div className="board">
      <Grid data={data} onSelection={handleSelection} />
      <Legend />
      <div className="actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleLoad}>Load</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleSolve}>Solve</button>
        <input type="file" ref={fileRef} style={{display:'none'}} onChange={handleSelectFile} />
      </div>
    </div>
  );
}

export default App;
