import React from 'react';
import { SubGrid } from './SubGrid';
import { IJsonGrid } from '../solver/grid';

export const Grid = ({data}: {data: IJsonGrid}) =>
  <table className="grid">
    <tbody>
      {data.rows.map((row, rowIndex) =>
        <tr key={rowIndex}>
          {row.columns.map((data, index) =>
            <td key={index}>
              <SubGrid data={data} />
            </td>
          )}
        </tr>
      )}
    </tbody>
  </table>;
