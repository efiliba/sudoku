import React, {MouseEvent} from 'react';
import classNames from 'classnames';
import {IJsonCell} from '../solver/cell';
import './Cell.scss';

export enum ModifierKeys {
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
  modifiers: ModifierKeys;
}

interface ICell {
  data: IJsonCell;
  onCellSelection: (e: ICellSelection) => void;
}

export const Cell = ({data, onCellSelection}: ICell) => {
  const handleClick = (optionColumn?: number, optionRow?: number) => (e: MouseEvent): void => {
    e.preventDefault();
    
    const modifiers = ModifierKeys.NONE |
      (e.getModifierState('Shift') && ModifierKeys.SHIFT) |
      (e.getModifierState('Control') && ModifierKeys.CONTROL) |
      (e.getModifierState('Alt') && ModifierKeys.OPTION) |
      ((e.getModifierState('Meta') || e.getModifierState('OS')) && ModifierKeys.COMMAND); // Mac / Windows (logo)
  
    onCellSelection({
      button: e.type === 'click' ? 'left' : 'right',
      symbol: e.currentTarget.textContent,
      optionColumn,
      optionRow,
      modifiers
    });
  };

  return data.rows
    ? <table className="cell">
        <tbody>
          {data.rows.map((row, rowIndex) =>
            <tr key={rowIndex}>
              {row.columns.map((data, index) =>
                <td
                  key={index}
                  className={classNames({'strike-out': data.strikeOut, 'highlight': data.highlight})}
                  onClick={handleClick(index, rowIndex)}
                  onContextMenu={handleClick(index, rowIndex)}
                >
                  {data.symbol}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    : <table className="cell symbol-selected">
        <tbody>
          <tr>
            <td
              className={`set-method-${data.setMethod}`}
              onClick={handleClick()}
              onContextMenu={handleClick()}
            >
              {data.symbol}
            </td>
          </tr>
        </tbody>
      </table>;
};