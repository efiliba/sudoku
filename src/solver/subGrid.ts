import {isPowerOf2} from "./utils/bitUtilities";
import {Cell, SetMethod, ICell, IJsonCell} from "./cell";

export interface IOption {
	subGridColumn: number;
	subGridRow: number;
	cellColumn: number;
	cellRow: number;
	bits: number;
}

// Arrays of last options found and options removed from all columns / rows in the sub grid
export interface IStruckOutCells {
	lastOptionsFound: IOption[];
	removedOptionsFromColumn: IOption[];
	removedOptionsFromRow: IOption[];
}

export type DebugSubGridType = number[][];

export interface IJsonSubGridRow {
	columns: IJsonCell[];
}

export interface IJsonSubGrid {
	rows?: IJsonSubGridRow[];
}

export interface ISubGrid {
	reset(): void;
	get(column: number, row: number): ICell;
	toJson(): IJsonSubGrid;
	setJson(json: IJsonSubGrid): void;
	setByPosition(column: number, row: number, optionColumn: number, optionRow: number, setMethod: SetMethod): boolean;
	setByOption(column: number, row: number, option: number, setMethod: SetMethod): boolean;
	setBySymbol(column: number, row: number, symbol: string, setMethod: SetMethod): number;
	compare(items: ICell[][]): boolean;
	simplify(): void;
	debug(log: boolean): DebugSubGridType;

	solved(): boolean;
	getAvailableOptionsMatrix(): number[][];
	getCellsMatrix(): ICell[][];
	getUnsetCells(): ICell[];
	unsetCells(totalUnsetOptions: number): ICell[];
	getAvailableOptions(): number[];
	strikeOutCell(cellColumn: number, cellRow: number, option: number): IStruckOutCells;
	isStruckOut(cellColumn: number, cellRow: number, symbol: string): boolean;
	removeOptionsFromColumn(cellColumn: number, options: number): IOption[];
	removeOptionsFromRow(cellRow: number, options: number): IOption[];
	removeOptionsExceptFromColumn(excludeColumn: number, options: number): IOption[];
	removeOptionsExceptFromRow(excludeRow: number, options: number): IOption[];
	removeIfExtraOptionsFromColumn(column: number, options: number): IOption[];
	removeIfExtraOptionsFromRow(row: number, options: number): IOption[];
	removeIfExtraOptions(options: number): IOption[];
	optionExistsInColumn(column: number, option: number): boolean;
	optionExistsInRow(row: number, option: number): boolean;
	optionRemovedFromColumn(cellColumn: number, cellRow: number, option: number): boolean;
	optionRemovedFromRow(cellColumn: number, cellRow: number, removedOption: number): boolean;
	setCells(subGrid: ICell[][]): void;
	loadOptions(options: number[]): void;
	loadSymbolPositions(positions: number[]): void;
	toSymbolPositions(): number[];
	toSetOptions(): number[];
}

export class SubGrid implements ISubGrid {
	private static columns: number;
	private static rows: number;

	private cells: ICell[][];                                                                   // Jagged array used for efficiency ???
//        private remainingCells: number;                                                             // Track how many unset cells are left

	static Constructor(columns: number, rows: number) {
		Cell.Constructor(rows, columns);                                                        // Swop columns and rows
		SubGrid.columns = columns;
		SubGrid.rows = rows;
	}

	constructor(public column: number, public row: number) {
		this.reset();
	}

	public reset() {
		this.cells = [];
		for (let row: number = 0; row < SubGrid.rows; row++) {
			this.cells[row] = [];
			for (let column: number = 0; column < SubGrid.columns; column++) {
				this.cells[row][column] = new Cell(column, row);
			}
		}

//            this.remainingCells = SubGrid.columns * SubGrid.rows;
	}

	public get(column: number, row: number): ICell {                  // grids called by [column, row] but accessed by [row][column] for efficiency
		return this.cells[row][column];
	}                                                      

	public toJson(): IJsonSubGrid {
		const json: IJsonSubGrid = { rows: [] };
		for (let row: number = 0; row < SubGrid.rows; row++) {
			const jsonCells: IJsonCell[] = [];
			for (let column: number = 0; column < SubGrid.columns; column++) {
				jsonCells.push(this.cells[row][column].json);
			}
			json.rows.push({ columns: jsonCells });
		}

		return json;
	}

	public setJson(json: IJsonSubGrid) {
//            this.remainingCells = SubGrid.columns * SubGrid.rows;

		for (let row: number = 0; row < json.rows.length; row++) {
			const columns: IJsonCell[] = json.rows[row].columns;
			for (let column = 0; column < columns.length; column++) {
				this.cells[row][column].setJson(columns[column]);
//                    if (this.cells[row][column].isSet)
//                        this.remainingCells--;
			}
		}
	}

	public setByPosition(column: number, row: number, optionColumn: number, optionRow: number, setMethod: SetMethod): boolean {
		const cell: ICell = this.cells[row][column];
		if (!cell.setMethod) {                                  				// cell unset i.e. == SetMethod.unset
			cell.setByPosition(optionColumn, optionRow, setMethod);
			return true;
//                this.remainingCells--;
		}
		else {
			return false;
		}
	}

	public setByOption(column: number, row: number, option: number, setMethod: SetMethod): boolean {
		const cell: ICell = this.cells[row][column];
		if (!cell.setMethod) {
			cell.setByOption(option, setMethod);
			return true;
//                this.remainingCells--;
		} else {
			return false;
		}
	}

	public setBySymbol(column: number, row: number, symbol: string, setMethod: SetMethod): number {
		const cell: ICell = this.cells[row][column];
		if (!cell.setMethod) {                                    			// cell unset i.e. == SetMethod.unset
			cell.setBySymbol(symbol, setMethod);
			return cell.options;
//                this.remainingCells--;
		} else {
				return 0;
		}
	}

	public compare(items: ICell[][]): boolean {
		let match: boolean = true;
		let row: number = SubGrid.rows;
		while (match && row--) {
			let column: number = SubGrid.columns;
			while (match && column--) {
				match = this.cells[row][column].equal(items[row][column]);
			}
		}

		return match;
	}

	public simplify() {
		let changed: boolean = true;
		while (changed /*&& this.remainingCells > 0*/) {
			changed = false;
			
			let row: number = SubGrid.rows;
			while (!changed && row--) {
				let column: number = SubGrid.columns;
				while (!changed && column--) {
					changed = this.cells[row][column].setMethod != null && this.removeIfExtraOptions(this.cells[row][column].options).length > 0;   // cell set i.e. != SetMethod.unset
				}
			}
		}
	}

	public debug(log: boolean = true): DebugSubGridType {
		const rows: DebugSubGridType = [];

		let row: number = SubGrid.rows;
		while (row--) {
			let column: number = SubGrid.columns;
			const optionsRow: number[] = [];
			while (column--) {
				optionsRow.unshift(this.cells[row][column].options);
			}
			rows.unshift(optionsRow);
		}

		if (log) {
			while (++row < SubGrid.rows) {
				console.log(rows[row].join(' | '));
			}
			console.log(Array(rows[0].length + 1).join('---'));
		}

		return rows;
	}

	public solved(): boolean {
		let solved: boolean = true;

		let row: number = SubGrid.rows;
		while (solved && row--) {
			let column: number = SubGrid.columns;
			while (solved && column--) {
				solved = this.cells[row][column].solved();
			}
		}

		return solved;
		//return !this.remainingCells;
	}

	public getAvailableOptionsMatrix(): number[][] {
		const matrix: number[][] = [];

		let row: number = SubGrid.rows;
		while (row--) {
			matrix[row] = [];
			let column: number = SubGrid.columns;
			while (column--) {
					matrix[row][column] = this.cells[row][column].options;
			}
		}

		return matrix;
	}

	public getCellsMatrix(): ICell[][] {
		const matrix: ICell[][] = [];

		let row: number = SubGrid.rows;
		while (row--) {
			matrix[row] = [];
			let column: number = SubGrid.columns;
			while (column--) {
				matrix[row][column] = new Cell(this.cells[row][column]);
			}
		}

		return matrix;
	}

	public getUnsetCells(): ICell[] {
		const unsetCells: ICell[] = [];

		for (let row: number = 0; row < SubGrid.rows; row++) {
			for (let column: number = 0; column < SubGrid.columns; column++) {
				if (!this.cells[row][column].setMethod)   {          				// cell unset i.e. == SetMethod.unset
						unsetCells.push(new Cell(this.cells[row][column]));			// Set copy of cell
				}
			}
		}
		return unsetCells;
	}

	public unsetCells(totalUnsetOptions: number): ICell[] {
		const cells: ICell[] = this.getUnsetCells();
		const unset: ICell[] = [];
		for (let index: number = 0; index < cells.length; index++) {
			if (cells[index].totalOptionsRemaining === totalUnsetOptions) {
				unset.push(cells[index]);
			}
		}

		return unset;
	}

	public getAvailableOptions(): number[] {
		const array: number[] = [];

		let row: number = SubGrid.rows;
		while (row--) {
			let column: number = SubGrid.columns;
			while (column--) {
				array[row * SubGrid.columns + column] = this.cells[row][column].options;
			}
		}

		return array;
	}

	// Remove option from all other cells in this sub grid - return array of last options found and options removed from all columns / rows in the sub grid
	public strikeOutCell(cellColumn: number, cellRow: number, option: number): IStruckOutCells {
		const lastOptions: IOption[] = [];
		const removedOptionsFromColumn: IOption[] = [];
		const removedOptionsFromRow: IOption[] = [];

		let column: number;
		let row: number = SubGrid.rows;
		while (--row > cellRow) {
			column = SubGrid.columns;
			while (column--) {
				if (this.cells[row][column].removeOption(option)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
				} else {
					if (this.optionRemovedFromColumn(column, row, option)) {
							removedOptionsFromColumn.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: -1, bits: option });
					}
					if (this.optionRemovedFromRow(column, row, option)) {
							removedOptionsFromRow.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: -1, cellRow: row, bits: option });
					}
				}
			}
		}

		column = SubGrid.columns;
		while (--column > cellColumn) {
			if (this.cells[row][column].removeOption(option)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
			}	else {
				if (this.optionRemovedFromColumn(column, row, option)) {
					removedOptionsFromColumn.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: -1, bits: option });
				}
				if (this.optionRemovedFromRow(column, row, option)) {
					removedOptionsFromRow.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: -1, cellRow: row, bits: option });
				}
			}
		}

		while (column--) {
			if (this.cells[row][column].removeOption(option)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
			} else {
				if (this.optionRemovedFromColumn(column, row, option)) {
						removedOptionsFromColumn.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: -1, bits: option });
				}
				if (this.optionRemovedFromRow(column, row, option)) {
						removedOptionsFromRow.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: -1, cellRow: -1, bits: option });
				}
			}
		}
		
		while (row--) {
			column = SubGrid.columns;
			while (column--) {
				if (this.cells[row][column].removeOption(option)) {
						lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
				} else {
					if (this.optionRemovedFromColumn(column, row, option)) {
						removedOptionsFromColumn.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: -1, bits: option });
					}
					if (this.optionRemovedFromRow(column, row, option)) {
						removedOptionsFromRow.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: -1, cellRow: row, bits: option });
					}
				}
			}
		}

		return { lastOptionsFound: lastOptions, removedOptionsFromColumn: removedOptionsFromColumn, removedOptionsFromRow: removedOptionsFromRow };
	}

	public isStruckOut(cellColumn: number, cellRow: number, symbol: string): boolean {
		return !this.cells[cellRow][cellColumn].containsSymbol(symbol);
	}

	public removeOptionsFromColumn(cellColumn: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		for (let row: number = 0; row < SubGrid.rows; row++) {
			if (this.cells[row][cellColumn].removeOptions(options)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: cellColumn, cellRow: row, bits: this.cells[row][cellColumn].options });
//                    this.remainingCells--;
			}
		}
		
		return lastOptions;
	}

	public removeOptionsFromRow(cellRow: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		for (let column: number = 0; column < SubGrid.columns; column++) {
			if (this.cells[cellRow][column].removeOptions(options)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: cellRow, bits: this.cells[cellRow][column].options });
//                    this.remainingCells--;
			}
		}

		return lastOptions;
	}

	public removeOptionsExceptFromColumn(excludeColumn: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		let row: number;
		let column: number = SubGrid.columns;
		while (--column > excludeColumn) {
			row = SubGrid.rows;
			while (row--) {
				if (this.cells[row][column].removeOptions(options)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                        this.remainingCells--;
				}
			}
		}

		while (column--) {
			row = SubGrid.rows;
			while (row--) {
				if (this.cells[row][column].removeOptions(options)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                        this.remainingCells--;
				}
			}
		}

		return lastOptions;
	}

	public removeOptionsExceptFromRow(excludeRow: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		let column: number;
		let row: number = SubGrid.rows;
		while (--row > excludeRow) {
			column = SubGrid.columns;
			while (column--) {
				if (this.cells[row][column].removeOptions(options)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                        this.remainingCells--;
				}
			}
		}

		while (row--) {
			column = SubGrid.columns;
			while (column--) {
				if (this.cells[row][column].removeOptions(options)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                        this.remainingCells--;
				}
			}
		}

		return lastOptions;
	}

	public removeIfExtraOptionsFromColumn(column: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		for (let row: number = 0; row < SubGrid.rows; row++) {
			if (this.cells[row][column].removeOptions(options)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                    this.remainingCells--;
			}
		}

		return lastOptions;
	}

	public removeIfExtraOptionsFromRow(row: number, options: number): IOption[] {
		const lastOptions: IOption[] = [];

		for (let column: number = 0; column < SubGrid.columns; column++) {
			if (this.cells[row][column].removeOptions(options)) {
				lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                    this.remainingCells--;
			}
		}

		return lastOptions;
	}

	public removeIfExtraOptions(options: number): IOption[] {
		const lastOptions: IOption[] = [];

		for (let row: number = 0; row < SubGrid.rows; row++) {
			for (let column: number = 0; column < SubGrid.columns; column++) {
				if (this.cells[row][column].removeOptions(options)) {
					lastOptions.push({ subGridColumn: this.column, subGridRow: this.row, cellColumn: column, cellRow: row, bits: this.cells[row][column].options });
//                        this.remainingCells--;
				}
			}
		}

		return lastOptions;
	}

	public optionExistsInColumn(column: number, option: number): boolean {
		let found: boolean = false;
		let row: number = SubGrid.rows;
		while (!found && row--) {
			found = this.cells[row][column].containsOption(option);
		}

		return found;
	}

	public optionExistsInRow(row: number, option: number): boolean {
		let found: boolean = false;
		let column: number = SubGrid.columns;
		while (!found && column-- > 0) {
				found = this.cells[row][column].containsOption(option);
		}

		return found;
	}

	public optionRemovedFromColumn(cellColumn: number, cellRow: number, option: number): boolean {
		// Check if option removed from column
		let optionFound: boolean = false;

		let row: number = SubGrid.rows;
		while (!optionFound && --row > cellRow) {
			optionFound = (this.cells[row][cellColumn].options & option) > 0;
		}
		while (!optionFound && row--) {
			optionFound = (this.cells[row][cellColumn].options & option) > 0;
		}

		return !optionFound;              															// If option not found then it was removed from this sub grid's column
	}

	public optionRemovedFromRow(cellColumn: number, cellRow: number, removedOption: number): boolean {
		// Check if option removed from row
		let optionFound: boolean = false;
		let column: number = SubGrid.columns;
		while (!optionFound && --column > cellColumn) {
			optionFound = (this.cells[cellRow][column].options & removedOption) > 0;
		}
		while (!optionFound && column--) {
			optionFound = (this.cells[cellRow][column].options & removedOption) > 0;
		}

		return !optionFound;                                          	// If option not found then it was removed from this sub grid's row
	}

	public setCells(subGrid: ICell[][]) {
		for (let row = 0; row < SubGrid.rows; row++) {
			for (let column = 0; column < SubGrid.columns; column++) {
				this.cells[row][column] = new Cell(subGrid[row][column]);
			}
		}
	}

	public loadOptions(options: number[]) {
		let index = 0;
		for (let row = 0; row < SubGrid.rows; row++) {
			for (let column = 0; column < SubGrid.columns; column++) {
				const option = options[index++];
				const cell = this.cells[row][column];
				if (!cell.setMethod && isPowerOf2(option)) {
					cell.setByOption(option, SetMethod.calculated);
				}
			}
		}
	}

	public loadSymbolPositions(positions: number[]) {
		let index = 0;
		for (let row = 0; row < SubGrid.rows; row++) {
			for (let column = 0; column < SubGrid.columns; column++) {
				const pos = positions[index++];
				if (pos > 0) {
					this.cells[row][column].setByIndex(pos - 1, SetMethod.loaded);
				}
			}
		}
	}

	public toSymbolPositions() {
		const positions: number[] = [];
		for (let row = 0; row < SubGrid.rows; row++) {
			for (let column = 0; column < SubGrid.columns; column++) {
				positions.push(this.cells[row][column].symbolPosition());
			}
		}
		return positions;
	}

	public toSetOptions() {
		const options: number[] = [];
		for (let row = 0; row < SubGrid.rows; row++) {
			for (let column = 0; column < SubGrid.columns; column++) {
				options.push(this.cells[row][column].setOption());
			}
		}
		return options;
	}
}
