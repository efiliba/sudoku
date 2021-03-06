import React, {useState, useRef, useEffect} from 'react';
import solver from "./solver";
import {Grid, ModifierKeys, IGridSelection, Legend} from './components';
import './App.scss';

const columns = 3;
const rows = 3;
solver.Grid.Constructor(columns, rows);
const grid = new solver.Grid();

const test2x2 = [
  1, 0, 0, 0,
  0, 2, 0, 0,
  0, 0, 3, 0,
  0, 0, 0, 4
];

const test2x1 = [
  1, 0,
  0, 0
];

const hard2x3 = [
  0, 0, 0, 1, 0, 0,  
  0, 0, 2, 0, 0, 3,  
  4, 0, 0, 3, 0, 0,  
  0, 0, 3, 0, 0, 5,  
  3, 0, 0, 6, 0, 0,  
  0, 0, 1, 0, 0, 0  
];

const hard3x3 = [
  6, 0, 0, 0, 9, 0, 0, 0, 7,  
  0, 4, 0, 0, 0, 7, 1, 0, 0,
  0, 0, 2, 8, 0, 0, 0, 5, 0,
  8, 0, 0, 0, 0, 0, 0, 9, 0,
  0, 0, 0, 0, 7, 0, 0, 0, 0,
  0, 3, 0, 0, 0, 0, 0, 0, 8,
  0, 5, 0, 0, 0, 2, 3, 0, 0,
  0, 0, 4, 5, 0, 0, 0, 2, 0,
  9, 0, 0, 0, 3, 0, 0, 0, 4
];

const App: React.FC = () => {
  const loadWasm = async () => {
    try {
      setWasm(await import('wasm'));
    } catch (err) {
      console.error(`Unexpected error loading WASM. [Message: ${err.message}]`);
    }
  };

  useEffect(() => {
    loadWasm();

    grid.loadPuzzle(hard3x3);
    setGridData(grid.toJson());
  }, []);

  const [gridData, setGridData] = useState(grid.toJson());
  const [wasm, setWasm] = useState(null);

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

  const handleSave = () => console.log(JSON.stringify(gridData, null, 2));

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

    grid.debug();
    console.log({solved, valid: grid.isValid()});
  };

  const handleWasmSolve = () => {
    const setOptions = new Uint32Array(grid.toSetOptions());
    const solved: number[] = Array.from(wasm.solve(columns, rows, setOptions));

    grid.loadOptions(solved);
    setGridData(grid.toJson());
  };

  return (
    <div className="board">
      <Grid data={gridData} onSelection={handleSelection} />
      <Legend />
      <div className="actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleLoad}>Load</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleSolve}>Solve</button>
        <hr />
        <button onClick={handleWasmSolve}>WASM Solve</button>
        <input type="file" ref={fileRef} style={{display:'none'}} onChange={handleSelectFile} />
      </div>
    </div>
  );
}

export default App;
