import React from 'react';
import {Cell} from '.';
import {IJsonCell} from '../solver/cell';
import './Legend.scss';

interface ILegendCell {
  data: IJsonCell;
  text: string;
  activeMouseButton?: 'left' | 'right';
  onSelection: () => void
}

const select: IJsonCell = {
  symbol: '3'
};

const pencil: IJsonCell = {
  rows: [
    { columns: [{ symbol: '1' }, { symbol: '2' }, { symbol: '3', highlight: true }] },
    { columns: [{ symbol: '4' }, { symbol: '5', highlight: true }, { symbol: '6' }] },
    { columns: [{ symbol: '7' }, { symbol: '8' }, { symbol: '9' }] }
  ]
};

const strikeOut: IJsonCell = {
  rows: [
    { columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }, { symbol: '3' }] },
    { columns: [{ symbol: '4' }, { symbol: '5' }, { symbol: '6', strikeOut: true }] },
    { columns: [{ symbol: '7' }, { symbol: '8', strikeOut: true }, { symbol: '9' }] }
  ]
};

const LegendCell = ({data, text, activeMouseButton, onSelection}: ILegendCell) =>
  <div  className={`legend__cell legend__cell--${activeMouseButton}`}>
    <Cell data={data} onCellSelection={onSelection} />
    <div className="legend__cell--text">{text}</div>
  </div>;

export const Legend = () =>
  <div className="legend">
    <div className="legend__heading">Mode</div>
    <LegendCell activeMouseButton="left" data={select} text="Select" onSelection={console.log} />
    <LegendCell activeMouseButton="right" data={pencil} text="Pencil" onSelection={console.log} />
    <LegendCell data={strikeOut} text="Strike Out" onSelection={console.log} />
  </div>;