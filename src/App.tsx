import React, {useState, useRef, useEffect} from 'react';
import solver from "./solver";
import {Grid, ModifierKeys, IGridSelection, Legend} from './components';
import './App.scss';

solver.Grid.Constructor(3, 3);
const grid = new solver.Grid();
// grid.fixByPosition(0, 0, 0, 0, 0, 0);
// grid.fixByPosition(0, 0, 1, 1, 1, 0);
// grid.fixByPosition(1, 1, 0, 0, 0, 1);
// grid.fixByPosition(1, 1, 1, 1, 1, 1);

const loadWasm = async () => {
  try {
    const wasm = await import('wasm');
    console.log(wasm.add(2, 3));
  } catch(err) {
    console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
  }
};

const App: React.FC = () => {
  useEffect(() => {
    loadWasm();
  }, []);

  const [data, setGridData] = useState(grid.toJson());
  const fileRef = useRef(null);
  const loadedFileData = useRef(null);

  const handleSelection = ({button, modifiers, subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow, symbol}: IGridSelection) => {
    switch (modifiers) {
      case ModifierKeys.NONE:
          const subGrid = grid.get(subGridColumn, subGridRow).get(cellColumn, cellRow);
          if (subGrid.solved()) {
            subGrid.reset();
          } else {
            grid.setByPositionShallow(subGridColumn, subGridRow, cellColumn, cellRow, optionColumn, optionRow);
          }
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
    loadedFileData.current = await (new Response(file)).text();
    fileRef.current.value = null;                                   // Enable re-loading the same file

    handleReset();
  };

  const handleReset = () => {
    grid.reset();
    
    const json = loadedFileData.current ? JSON.parse(loadedFileData.current) : grid.toJson();
    grid.setJson(json);
    setGridData(json);
  };

  const handleSolve = () => {
    const solved = grid.solve({restart: true, maxRecursionLevel: 2});
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
