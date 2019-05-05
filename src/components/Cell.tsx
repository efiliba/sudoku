import React from 'react';

// export const Cell = ({columns, rows, options, onSelect, onStrikeOut}) => {
export const Cell = ({options}) => {
  return (
    <table className="cell">
      <tbody>
        <tr>
          <td className="strikeOut">
              {options}
          </td>
        </tr>
      </tbody>
    </table>);
};
