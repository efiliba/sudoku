import React from 'react';
import {Cell, ICellSelection} from './Cell';
import {IJsonSubGrid} from '../solver/subGrid';

export interface ISubGridSelection extends ICellSelection {
  cellColumn: number;
  cellRow: number;
}

export const SubGrid = ({data, onSubGridSelection}:
  {data: IJsonSubGrid, onSubGridSelection: (e: ISubGridSelection) => void}) => {
  // calc width based on length of rows and columns
  const totalRows = data.rows.length;
  const totalColumns = data.rows[0].columns.length;
  const total = totalRows * totalColumns;
  const width = 90 / total + 'vw';
  const height = 90 / total + 'vh';

  const handleCellSelection = (cellColumn: number, cellRow: number) => (cellSelection: ICellSelection) => {
    onSubGridSelection({...cellSelection, cellColumn, cellRow});
  };

  return (
    <table className="sub-grid">
      <tbody>
        {data.rows.map((row, rowIndex) =>
          <tr key={rowIndex}>
            {row.columns.map((data, index) =>
              <td key={index} style={{width, height, verticalAlign: 'middle'}}>
                <Cell data={data} onCellSelection={handleCellSelection(index, rowIndex)} />
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
};
