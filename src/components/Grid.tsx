import React from 'react';
import {SubGrid, ISubGridSelection} from './SubGrid';
import {IJsonGrid} from '../solver/grid';

export interface IGridSelection extends ISubGridSelection {
  subGridColumn: number;
  subGridRow: number;
}

export const Grid = ({data, onSelection}: {data: IJsonGrid, onSelection: (e: IGridSelection) => void}) => {
  const handleCellSelection = (subGridColumn: number, subGridRow: number) => (subGridSelection: ISubGridSelection) => {
    onSelection({...subGridSelection, subGridColumn, subGridRow});
  };

  return (
    <table className="grid">
      <tbody>
        {data.rows.map((row, rowIndex) =>
          <tr key={rowIndex}>
            {row.columns.map((data, index) =>
              <td key={index}>
                <SubGrid data={data} onSubGridSelection={handleCellSelection(index, rowIndex)}/>
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
};
