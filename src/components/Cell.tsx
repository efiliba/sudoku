import React, {MouseEvent} from 'react';
import {IJsonCell} from '../solver/cell';
import './Cell.scss';

export enum Modifier {
  NONE = 0,
  SHIFT = 1,
  CONTROL = 2,
  OPTION = 4,
  COMMAND = 8
}

export interface ICellSelection {
  button: string;
  symbol: string;
  optionColumn: number;
  optionRow: number;
  modifiers: Modifier;
}

export const Cell = ({data, onCellSelection}: {data: IJsonCell, onCellSelection: (e: ICellSelection) => void}) => {
  const handleClick = (optionColumn: number, optionRow: number) => (e: MouseEvent) => {
    e.preventDefault();
    
    const modifiers = Modifier.NONE |
      (e.getModifierState('Shift') && Modifier.SHIFT) |
      (e.getModifierState('Control') && Modifier.CONTROL) |
      (e.getModifierState('Alt') && Modifier.OPTION) |
      ((e.getModifierState('Meta') || e.getModifierState('OS')) && Modifier.COMMAND); // Mac / Windows (logo)

    onCellSelection({
      button: e.type === 'click' ? 'left' : 'right',
      symbol: e.currentTarget.textContent,
      optionColumn,
      optionRow,
      modifiers
    });
  };
  
  return !data.rows
    ? <table className="cell symbol-selected">
        <tbody>
          <tr>
            <td className={`set-method-${data.setMethod}`}>
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
                <td
                  key={index}
                  className={data.strikeOut ? 'strike-out' : 'available'}
                  onClick={handleClick(index, rowIndex)}
                  onContextMenu={handleClick(index, rowIndex)}
                >
                  {data.symbol}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>;
};