import React from 'react';
import {IJsonCell} from '../solver/cell';

export const Cell = ({data}: {data: IJsonCell}) =>
  !data.rows
    ? <table className="symbol-selected">
        <tbody>
          <tr>
            <td>
              {data.symbol}
            </td>
          </tr>
        </tbody>
      </table>
    : <table className="cell">
        <tbody>
          {data.rows.map((row, rowIndex) =>
            <tr key={rowIndex}>
              {row.columns.map((data, index) =>
                <td key={index} className={data.strikeOut ? 'strike-out' : 'available'}>
                  {data.symbol}
                  {/* <svg xmlns="http://www.w3.org/2000/svg">
                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="red" stroke-width="1" />
                  </svg> */}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>;
