import React from 'react';
import {Cell} from './Cell';
import {IJsonSubGrid} from '../solver/subGrid';

export const SubGrid = ({data}: {data: IJsonSubGrid}) => {
  // calc width based on length of rows and columns
  const totalRows = data.rows.length;
  const totalColumns = data.rows[0].columns.length;
  const total = totalRows * totalColumns;
  const width = 90 / total + 'vw';
  const height = 90 / total + 'vh';

  return (
    <table className="sub-grid">
      <tbody>
        {data.rows.map((row, rowIndex) =>
          <tr key={rowIndex}>
            {row.columns.map((data, index) =>
              <td key={index} style={{width, height, verticalAlign: 'middle'}}>
                <Cell data={data} />
              </td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
}
