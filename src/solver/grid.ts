import {IOnlyOption, bitwiseOR, numberOfBitsSet, onlyOption, containingBitIndex} from "./utils/bitUtilities";
import {groupBy, transposeRows} from "./utils/arrayUtilities";
import {Combinations} from "./utils/combinations";
import {SetMethod, ICell, IJsonCell} from "./cell";
import {SubGrid, ISubGrid, IOption, DebugSubGridType, IStruckOutCells, IJsonSubGrid} from "./subGrid";

interface ILimitedOption {                                      		// Options limited to a column, row or both (sub-grid)
	column: number;
	row: number;
	options: number;
}

interface IUnsetCells {
	column: number;
	row: number;
	cells: ICell[];
}

export interface IJsonGridRow {
	columns: IJsonSubGrid[];
}

export interface IJsonGrid {
	rows: IJsonGridRow[];
}

export interface IGrid {
	reset(): void;
	get(column: number, row: number): ISubGrid;
	toJson(): IJsonGrid;
	setJson(json: IJsonGrid, simplify?: boolean): void;
	compare(items: ISubGrid[][]): boolean;
	solve(params?: {restart?: boolean, eliminateAfter?: number, maxRecursionLevel?: number}): boolean;
	solved(): boolean;
	removeOptionAtPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): boolean;
	removeOption(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number): boolean;
	simplify(): boolean;
	debug(log: boolean): DebugSubGridType[][];

	isValid(): boolean;
	save(): ICell[];
	loadOptions(options: number[]): void;
	loadSymbolPositions(positions: number[]): void;
	toSymbolPositions(): number[];
	toSetOptions(): number[];

	strikeOut(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number): void;
	isStruckOut(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, symbol: string): boolean;        
	fixByPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): void;
	setByOption(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number, setMethod?: SetMethod): void;
	setBySymbol(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, symbol: string, setMethod?: SetMethod): void;
	setByPositionShallow(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number, setMethod: SetMethod): void;
	setByOptionShallow(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number, setMethod: SetMethod): void;
	toggleStrikeOutAtPositionShallow(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): void;
	togglePencilInAtPositionShallow(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): void;
	fixByOptions(fixedOptions: number[]): void;
	fixByCsv(options: string): void;
	unfix(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number): void;
}

export class Grid implements IGrid {
	private static columns: number;
	private static rows: number;
	private static combinations: Combinations<ICell>;

	private subGrids: ISubGrid[][];                                  	// Jagged array used for efficiency ???
	private totalSet: number;                                         // Track how many cells have been set

	static Constructor(columns: number, rows: number) {
		Grid.combinations = new Combinations<ICell>(columns * rows);
		SubGrid.Constructor(rows, columns);                             // Swop columns and rows
		Grid.columns = columns;
		Grid.rows = rows;
	}

	constructor() {
		this.reset();
	}

	public reset() {
		this.subGrids = [];
		for (let row: number = 0; row < Grid.rows; row++) {
			this.subGrids[row] = [];
			for (let column: number = 0; column < Grid.columns; column++) {
				this.subGrids[row][column] = new SubGrid(column, row);
			}
		}

		this.totalSet = 0;
	}

	public get(column: number, row: number): ISubGrid {           		// sub-grids called by [column, row] but accessed by [row][column] for efficiency
		return this.subGrids[row][column];
	}                                                      

	public toJson(): IJsonGrid {
		const json: IJsonGrid = { rows: [] };
		for (let row: number = 0; row < Grid.rows; row++) {
			const jsonSubGrids: IJsonCell[] = [];
			for (let column: number = 0; column < Grid.columns; column++) {
				jsonSubGrids.push(this.subGrids[row][column].toJson());
			}
			json.rows.push({ columns: jsonSubGrids });
		}

		return json;
	}

	public setJson(json: IJsonGrid, simplify: boolean = false) {
		// Set sub grids' json values  
		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			const jsonColumns: IJsonSubGrid[] = json.rows[subGridRow].columns;
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
					this.subGrids[subGridRow][subGridColumn].setJson(jsonColumns[subGridColumn]);
			}
		}

		if (simplify) {
			this.strikeOutFromSetCells();
		}
	}

	private strikeOutFromSetCells() {
		this.totalSet = 0;
		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
				const subGrid: ISubGrid = this.subGrids[subGridRow][subGridColumn];
				for (let cellRow: number = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn: number = 0; cellColumn < Grid.rows; cellColumn++) {
						const cell: ICell = subGrid.get(cellColumn, cellRow);
						if (cell.setMethod) {                                		// cell set i.e. != SetMethod.unset
							this.totalSet++;
							this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, cell.options);
						}
					}
				}
			}
		}
	}

	public compare(items: ISubGrid[][]): boolean {
		let match: boolean = true;
		let row: number = Grid.rows;
		while (match && row--) {
			let column: number = Grid.columns;
			while (match && column--) {
				match = this.subGrids[row][column].compare(items[row][column].getCellsMatrix());
			}
		}

		return match;
	}

	public solve({restart, eliminateAfter = 0, maxRecursionLevel = 1}: {restart?: boolean, eliminateAfter?: number, maxRecursionLevel?: number} = {}): boolean {
		if (restart) {
			this.strikeOutFromSetCells();
		}
	
		do {                                                            // Repeat while an only option found or an option removed
			while (this.simplify())
					;
		} while (this.totalSet > eliminateAfter && maxRecursionLevel > 0 && this.eliminate(Grid.columns * Grid.rows, maxRecursionLevel));

		return this.solved();// totalSet === columns * rows * columns * rows;
	}

	public solved(): boolean {
		let solved: boolean = true;

		let row: number = Grid.rows;
		while (solved && row--) {
			let column: number = Grid.columns;
			while (solved && column--) {
				solved = this.subGrids[row][column].solved();
			}
		}

		return solved;
	}

	public removeOptionAtPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): boolean {
		const cell: ICell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);
		if (cell.removeOptionAtPosition(optionColumn, optionRow)) {			// Check if last option left
			this.totalSet++;
			this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, cell.options);	// Remaining option
			return true;
		} else {
			return false;
		}
	}

	public removeOption(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number): boolean {
		let cell: ICell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);
		if (cell.removeOption(option)) {                     						// Check if last option left
			this.totalSet++;
			this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, cell.options);	// Remaining option
			return true;
		} else {
			return false;
		}
	}

	public simplify(): boolean {
		let onlyOptionFound: boolean = false;

		// Check/remove only options in columns/rows/sub-grids and mulitipe options limited to a certain number of related cells i.e. if 2 cells in a row can only contain 1 or 2 => remove from other cells in row 
		while (this.removeOnlyOptions() || this.checkLimitedOptions()) {
			onlyOptionFound = true;
		}

		return onlyOptionFound;
	}

	public debug(log: boolean = true): DebugSubGridType[][] {
		const rows: DebugSubGridType[][] = [];

		let row: number = Grid.rows;
		while (row--) {
			let column: number = Grid.columns;
			const subGridsRow: DebugSubGridType[] = [];
			while (column--) {
				subGridsRow.unshift(this.subGrids[row][column].debug(false));
			}
			rows.unshift(subGridsRow);
		}

		if (log) {
			while (++row < Grid.rows) {
				console.log(rows[row].join(' | '));
			}
			console.log(Array(rows[0].length + 1).join('---'));
		}

		return rows;
	}

	public isValid(): boolean {
		const valid: boolean = this.matrixValid(this.getTransposedCellsMatrix()) && this.matrixValid(this.getCellsMatrix());  // Check columns and rows contain all options and no set cell duplicted 

		return valid;
	}

	private matrixValid(matrix: ICell[][]): boolean {
		let valid: boolean = true;
		const size: number = Grid.columns * Grid.rows;
		let index: number = size;
		while (valid && index--) {
			let setOptions: number[] = this.setDistinctOptions(matrix[index]);	// Get unique set cells
			let unsetOptions: number[] = this.unsetOptions(matrix[index]);

			valid = setOptions.length + unsetOptions.length === size &&   // Ensures setOptions did not contain duplicates
				(bitwiseOR(setOptions) | bitwiseOR(unsetOptions)) === (1 << size) - 1; // totalSetOptions | totalUnsetOptions must contain all the options
		}

		return valid;
	}

	private setDistinctOptions(cells: ICell[]): number[] {
		// cells.Where(x => x.IsSet).GroupBy(x => x.Options).Where(x => x.Count() == 1).Select(x => x.Key);
		let distinct: number[] = [];
		let hash = {};
		for (let index: number = 0; index < cells.length; index++) {
			let options: number = cells[index].options;
			if (cells[index].setMethod && !hash[options]) {               // cell set i.e. != SetMethod.unset
				distinct.push(options);
				hash[options] = true;
			}
		}

		return distinct;
	}

	private unsetOptions(cells: ICell[]): number[] {
		// cells.Where(x => !x.IsSet).Select(x => x.Options)
		let options: number[] = [];
		for (let index: number = 0; index < cells.length; index++) {
			if (!cells[index].setMethod) {                       					// cell unset i.e. == SetMethod.unset
				options.push(cells[index].options);
			}
		}

		return options;
	}

	private load(cells: ICell[]) {
		const subGrid: ICell[][] = [];
		for (let row: number = 0; row < Grid.columns; row++) {       		// Use SubGrid's number of rows i.e. swopped columns
				subGrid[row] = [];
		}
		let size: number = Grid.columns * Grid.rows;

		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow: number = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn: number = 0; cellColumn < Grid.rows; cellColumn++) {
						subGrid[cellRow][cellColumn] = cells[subGridRow * size * Grid.columns + subGridColumn * Grid.rows + cellRow * size + cellColumn];
					}
				}

				this.subGrids[subGridRow][subGridColumn].setCells(subGrid);
			}
		}
	}

	public save(): ICell[] {
		let size: number = Grid.columns * Grid.rows;
		let cells: ICell[] = [];

		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();
				for (let cellRow = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn = 0; cellColumn < Grid.rows; cellColumn++) {
						cells[subGridRow * size * Grid.columns + subGridColumn * Grid.rows + cellRow * size + cellColumn] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return cells;
	}

	public loadOptions(options: number[]) {
		const size = Grid.columns * Grid.rows;
		const grouped = groupBy(options, size);
		// const transposed: number[][][] = transposeRows(Grid.columns, grouped);

		let index = 0;
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				this.subGrids[subGridRow][subGridColumn].loadOptions(grouped[index++])
			}
		}
	}

	public loadSymbolPositions(positions: number[]) {
		const size = Grid.columns * Grid.rows;
		const grouped = groupBy(positions, size);
		const transposed: number[][][] = transposeRows(Grid.columns, grouped);

		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				this.subGrids[subGridRow][subGridColumn].loadSymbolPositions(transposed[subGridRow][subGridColumn])
			}
		}
	}

	public toSymbolPositions() {
		const positions: number[] = [];
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				positions.push(...this.subGrids[subGridRow][subGridColumn].toSymbolPositions());
			}
		}
		return positions;
	}

	public toSetOptions() {
		const options: number[] = [];
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				options.push(...this.subGrids[subGridRow][subGridColumn].toSetOptions());
			}
		}
		return options;
	}

	private eliminate(unsetOptionsDepth: number, recursionLevel: number): boolean {
		let cells: ICell[] = this.save();                           		// Save current state
		let saveTotalSet: number = this.totalSet;

		let valid: boolean = true;
		let totalUnsetOptions: number = 1;
		while (valid && ++totalUnsetOptions < unsetOptionsDepth) {
			let row: number = Grid.rows;
			while (valid && row-- > 0) {
				let column = Grid.columns;
				while (valid && column-- > 0) {
					let unsetCells: IUnsetCells = this.unsetCells(column, row, totalUnsetOptions);	// May reduce column and row indices
					column = unsetCells.column;
					row = unsetCells.row;

					let index: number = unsetCells.cells.length;
					while (valid && index--) {
						let cell: ICell = unsetCells.cells[index];

						let options: number = cell.options;
						let cellColumn: number = cell.getColumn();
						const cellRow: number = cell.getRow();

						let tryOption: number = options & ~(options - 1);				// lowest set bit value
						while (tryOption && valid) {
							this.setByOption(column, row, cellColumn, cellRow, tryOption, SetMethod.calculated);
							this.solve({eliminateAfter: unsetOptionsDepth, maxRecursionLevel: recursionLevel - 1});
							valid = this.isValid();
							this.load(cells);                         						// Reset
							this.totalSet = saveTotalSet;

							if (valid) {
								options -= tryOption;                 							// remove tried option
								tryOption = options & ~(options - 1);
							} else {
								this.removeOption(column, row, cellColumn, cellRow, tryOption);	// Remove tryOption i.e. resulted in an invalid state
							}
						}
					}
				}
			}
		}

		return !valid;                                                  // Option removed?
	}

	private unsetCells(column: number, row: number, totalUnsetOptions: number): IUnsetCells {
		let cells: ICell[] = [];
		let set = false;
		while (!set && row >= 0) {
			while (!set && column >= 0) {
				cells = this.subGrids[row][column].unsetCells(totalUnsetOptions);
				if (!(set = cells.length > 0)) {
					column--;
				}
			}

			if (!set && row--) {
				column = Grid.columns - 1;
			}
		}

		return { column: column, row: row, cells: cells };
	}

	public strikeOut(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number) {
		let struckOutCells: IStruckOutCells = this.subGrids[subGridRow][subGridColumn].strikeOutCell(cellColumn, cellRow, option);

		let removeOption: IOption;

		let index: number = struckOutCells.removedOptionsFromColumn.length; // Distinct
		while (index--) {  
			removeOption = struckOutCells.removedOptionsFromColumn[index];
			this.join(struckOutCells.lastOptionsFound, this.removeOptionFromOtherColumns(removeOption.subGridColumn, removeOption.subGridRow, removeOption.cellColumn, removeOption.bits));
		}

		index = struckOutCells.removedOptionsFromRow.length;
		while (index--) {  
			removeOption = struckOutCells.removedOptionsFromRow[index];
			this.join(struckOutCells.lastOptionsFound, this.removeOptionFromOtherRows(removeOption.subGridColumn, removeOption.subGridRow, removeOption.cellRow, removeOption.bits));
		}

		this.join(struckOutCells.lastOptionsFound, this.removeOptionsFromColumn(subGridColumn, subGridRow, cellColumn, option));
		this.join(struckOutCells.lastOptionsFound, this.removeOptionsFromRow(subGridColumn, subGridRow, cellRow, option));

		let lastOption: IOption;
		index = struckOutCells.lastOptionsFound.length;
		while (index--) {
			lastOption = struckOutCells.lastOptionsFound[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
			// this.subGrids[lastOption.subGridRow][lastOption.subGridColumn].get(lastOption.cellColumn, lastOption.cellRow).setMethod = SetMethod.calculated;
		}

		this.totalSet += struckOutCells.lastOptionsFound.length;
	}

	public isStruckOut(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, symbol: string): boolean {
		return this.subGrids[subGridRow][subGridColumn].isStruckOut(cellColumn, cellRow, symbol);
	}       

	public fixByPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number) {
		if (this.subGrids[subGridRow][subGridColumn].setByPosition(cellColumn, cellRow, optionColumn, optionRow, SetMethod.loaded)) {
			this.totalSet++;
		}

		this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, 1 << Grid.columns * optionRow + optionColumn);
	}

	public setByOption(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number, setMethod: SetMethod = SetMethod.user) {
		if (this.subGrids[subGridRow][subGridColumn].setByOption(cellColumn, cellRow, option, setMethod)) {
			this.totalSet++;
		}

		this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, option);
	}

	public setBySymbol(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, symbol: string, setMethod: SetMethod = SetMethod.user) {
		const option = this.subGrids[subGridRow][subGridColumn].setBySymbol(cellColumn, cellRow, symbol, setMethod);
		if (option > 0) {
			this.totalSet++;
		}

		this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, option);
	}

	public setByPositionShallow(
		subGridColumn: number,
		subGridRow: number,
		cellColumn: number,
		cellRow: number,
		optionColumn: number,
		optionRow: number,
		setMethod: SetMethod = SetMethod.user
	) {
		if (this.subGrids[subGridRow][subGridColumn].setByPosition(cellColumn, cellRow, optionColumn, optionRow, setMethod)) {
			this.totalSet++;
		}
	}

	public setByOptionShallow(
		subGridColumn: number,
		subGridRow: number,
		cellColumn: number,
		cellRow: number,
		option: number,
		setMethod: SetMethod = SetMethod.user
	) {
		if (this.subGrids[subGridRow][subGridColumn].setByOption(cellColumn, cellRow, option, setMethod)) {
			this.totalSet++;
		}
	}

	public toggleStrikeOutAtPositionShallow(
		subGridColumn: number,
		subGridRow: number,
		cellColumn: number,
		cellRow: number,
		optionColumn: number,
		optionRow: number
	) {
		const cell: ICell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);
		cell.toggleRemoveOptionAtPositionShallow(optionColumn, optionRow);
	}

	public togglePencilInAtPositionShallow(
		subGridColumn: number,
		subGridRow: number,
		cellColumn: number,
		cellRow: number,
		optionColumn: number,
		optionRow: number
	) {
		const cell: ICell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);
		cell.toggleHighlightOptionAtPosition(optionColumn, optionRow);
	}

	public fixByOptions(fixedOptions: number[]) {
		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow: number = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn: number = 0; cellColumn < Grid.rows; cellColumn++) {
						const option = fixedOptions[(subGridRow * Grid.columns + cellRow) * Grid.columns * Grid.rows + subGridColumn * Grid.rows + cellColumn];
						if (option) {
							this.totalSet++;
							this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow).setByOption(option, SetMethod.loaded);
							this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, option);
						}
					}
				}
			}
		}
	}

	public fixByCsv(options: string) {
		let option: number;
		for (let subGridRow: number = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn: number = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow: number = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn: number = 0; cellColumn < Grid.rows; cellColumn++) {
						//                int.TryParse(options.Substring((subGridRow * columns + cellRow) * columns * rows + subGridColumn * rows + cellColumn, 1), out option);
						if (option) {
							this.totalSet++;
							option = 1 << (option - 1);
							this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow).setByOption(option, SetMethod.loaded);
							this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, option);
						}
					}
				}
			}
		}
	}

	public unfix(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number) {
		this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow).reset();

		const fixedCells: number[] = [];
		const cells: ICell[] = this.getCellsArray();
		for (let index: number = 0; index < cells.length; index--) {
			fixedCells.push(cells[index].setMethod === SetMethod.loaded || cells[index].setMethod === SetMethod.user ? cells[index].options : 0);	// Get fixed cells i.e. 0, 0, 0, 8, 4, 0, 0, 1, ...
		}

		this.reset();
		this.fixByOptions(fixedCells);
		this.solve();
	}

	private getCellsArray(): ICell[] {
		let array: ICell[] = [];

		let subGridRow: number = Grid.rows;
		while (subGridRow--) {
			let subGridColumn: number = Grid.columns;
			while (subGridColumn--) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellColumn: number = Grid.rows;
				while (cellColumn--) {
					let cellRow: number = Grid.columns;
					while (cellRow--) {
						array[(subGridRow * Grid.columns + cellRow) * Grid.columns * Grid.rows + subGridColumn * Grid.rows + cellColumn] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return array;
	}

	// Remove option from the other sub grid's columns / rows when the option must belong in a specific sub grid's column / row
	public removeUnavailableOptionsAtPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): boolean {
		return this.removeUnavailableOptions(subGridColumn, subGridRow, cellColumn, cellRow, 1 << Grid.columns * optionRow + optionColumn);
	}

	private removeUnavailableOptions(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number): boolean {
		let lastOptions: IOption[] = [];

		// Check sub grid's column and if found remove option from other columns
		if (this.subGrids[subGridRow][subGridColumn].optionRemovedFromColumn(cellColumn, cellRow, option)) {
			lastOptions = this.removeOptionFromOtherColumns(subGridColumn, subGridRow, cellColumn, option);
		}

		// Check sub grid's row and if found remove option from other rows
		if (this.subGrids[subGridRow][subGridColumn].optionRemovedFromRow(cellColumn, cellRow, option)) {
			lastOptions = this.removeOptionFromOtherRows(subGridColumn, subGridRow, cellRow, option);
		}

		let lastOption: IOption;
		let index: number = lastOptions.length;
		while (index--) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		return lastOptions !== null;
	}

	// Check for mulitipe options limited to a certain number of related cells i.e. 2 cells in a row can only contain 1 or 2 => remove from other cells in row
	private checkLimitedOptions(): boolean {
		let limitedOptions: ILimitedOption[] = this.findOptionsLimitedToMatrix(this.getTransposedCellsMatrix());// Columns
		let limitedOptionFound: boolean = this.removeIfExtraOptionsFromColumn(limitedOptions);  // Remove options iff the cell contains other options

		if (!limitedOptionFound) {
			limitedOptions = this.findOptionsLimitedToMatrix(this.getCellsMatrix());	// Rows
			limitedOptionFound = this.removeIfExtraOptionsFromRow(limitedOptions);
		}

		if (!limitedOptionFound) {
			limitedOptions = this.findOptionsLimitedToSubGrids();
			limitedOptionFound = this.removeIfExtraOptionsFromSubGrid(limitedOptions);
		}

		return limitedOptionFound;
	}

	private findOptionsLimitedToMatrix(cells: ICell[][]): ILimitedOption[] {
		let limitedOptions: ILimitedOption[] = [];
		let unsetCells: ICell[] = [];
		let pickOptions: ICell[] = [];
		let combinationOptions: number[] = [];

		for (let cellIndex: number = 0; cellIndex < Grid.columns * Grid.rows; cellIndex++) {
			while (unsetCells.length) {                               		// Clear array
				unsetCells.pop();
			}

			// IEnumerable<Cell> unsetCells = cells[index].Where(x => !x.IsSet);	// Get cells that are still to be set
			let checkCells: ICell[] = cells[cellIndex];
			let index: number = checkCells.length;
			while (index--) {
				if (!checkCells[index].setMethod)                      			// cell unset i.e. == SetMethod.unset
					unsetCells.push(checkCells[index]);
			}
			let totalUnsetCells: number = unsetCells.length;

			// Find max remaining options, less than totalUnsetCells
			// int maxRemainingOptions = unsetCells.Where(x => x.TotalOptionsRemaining < totalUnsetCells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < totalUnsetCells
			let maxRemainingOptions: number = 0;
			index = totalUnsetCells;
			while (index--) {
				let totalOptionsRemaining: number = unsetCells[index].totalOptionsRemaining;
				if (totalOptionsRemaining < totalUnsetCells && totalOptionsRemaining > maxRemainingOptions)
					maxRemainingOptions = totalOptionsRemaining;
			}

			let found: boolean = false;
			let pick: number = 1;
			while (!found && pick++ < maxRemainingOptions) {
				while (combinationOptions.length) {                    			// Clear arrays
					combinationOptions.pop();
				}
				while (pickOptions.length) {
					pickOptions.pop();
				}

				// Get options with at least the number of bits to pick set
				// IEnumerable <Cell> options = unsetCells.Where(x => x.TotalOptionsRemaining <= pick); // Get options with at least the number of bits to pick set
				index = totalUnsetCells;
				while (index--) {
					if (unsetCells[index].totalOptionsRemaining <= pick) {
						pickOptions.push(unsetCells[index]);
					}
				}

				let combinations: ICell[][] = Grid.combinations.select(pickOptions, pick);
				index = combinations.length;
				while (!found && index--) {
					// int removeOptions = BitwiseOR(enumerator.Current.Select(x => x.Options));
					let combinationsIndex: number = combinations[index].length;
					while (combinationsIndex--) {
						combinationOptions.push(combinations[index][combinationsIndex].options);
					}
					let removeOptions: number = bitwiseOR(combinationOptions);

					found = numberOfBitsSet(removeOptions) <= pick;
					if (found) {
						limitedOptions.push({ column: cellIndex, row: cellIndex, options: removeOptions });
					}
				}
			}
		}

		return limitedOptions;
	}

	private findOptionsLimitedToSubGrids(): ILimitedOption[] {
		let limitedOptions: ILimitedOption[] = [];
		let pickOptions: ICell[] = [];
		let combinationOptions: number[] = [];

		for (let row: number = 0; row < Grid.rows; row++) {
			for (let column: number = 0; column < Grid.columns; column++) {
				let unsetCells: ICell[] = this.subGrids[row][column].getUnsetCells();
				let totalUnsetCells: number = unsetCells.length;

				// int maxRemainingOptions = unsetCells.Where(x => x.TotalOptionsRemaining < totalUnsetCells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < totalUnsetCells
				let maxRemainingOptions: number = 0;
				let index: number = totalUnsetCells;
				while (index--) {
					const totalOptionsRemaining: number = unsetCells[index].totalOptionsRemaining;
					if (totalOptionsRemaining < totalUnsetCells && totalOptionsRemaining > maxRemainingOptions) {
						maxRemainingOptions = totalOptionsRemaining;
					}
				}

				let found: boolean = false;
				let pick: number = 1;
				while (!found && pick++ < maxRemainingOptions) {
					while (combinationOptions.length) {                       // Clear arrays
						combinationOptions.pop();
					}
					while (pickOptions.length) {
						pickOptions.pop();
					}

					// Get options with at least the number of bits to pick set
					// IEnumerable <Cell> options = unsetCells.Where(x => x.TotalOptionsRemaining <= pick); // Get options with at least the number of bits to pick set
					index = totalUnsetCells;
					while (index--) {
						if (unsetCells[index].totalOptionsRemaining <= pick) {
							pickOptions.push(unsetCells[index]);
						}
					}

					let combinations: ICell[][] = Grid.combinations.select(pickOptions, pick);
					index = combinations.length;
					while (!found && index--) {
						// int removeOptions = BitwiseOR(enumerator.Current.Select(x => x.Options));
						let combinationsIndex: number = combinations[index].length;
						while (combinationsIndex--) {
							combinationOptions.push(combinations[index][combinationsIndex].options);
						}
						let removeOptions: number = bitwiseOR(combinationOptions);

						found = numberOfBitsSet(removeOptions) <= pick;
						if (found) {
							limitedOptions.push({ column: column, row: row, options: removeOptions });
						}
					}
				}
			}
		}

		return limitedOptions;
	}

	private removeIfExtraOptionsFromColumn(limitedOptions: ILimitedOption[]): boolean {
		let lastOptions: IOption[] = [];

		let limitedOption: ILimitedOption;
		let index: number = limitedOptions.length;
		while (index--) {
			limitedOption = limitedOptions[index];
			for (let row: number = 0; row < Grid.rows; row++) {
				this.join(lastOptions, this.subGrids[row][limitedOption.column / Grid.rows >> 0].removeIfExtraOptionsFromColumn(limitedOption.column % Grid.rows, limitedOption.options));
			}
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index--) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeIfExtraOptionsFromRow(limitedOptions: ILimitedOption[]): boolean {
		let lastOptions: IOption[] = [];

		let limitedOption: ILimitedOption;
		let index: number = limitedOptions.length;
		while (index--) {
			limitedOption = limitedOptions[index];
			for (let column: number = 0; column < Grid.columns; column++) {
					this.join(lastOptions, this.subGrids[limitedOption.row / Grid.columns >> 0][column].removeIfExtraOptionsFromRow(limitedOption.row % Grid.columns, limitedOption.options));
			}
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index--) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeIfExtraOptionsFromSubGrid(limitedOptions: ILimitedOption[]): boolean {
		let lastOptions: IOption[] = [];

		let limitedOption: ILimitedOption;
		let index: number = limitedOptions.length;
		while (index--) {
			limitedOption = limitedOptions[index];
			this.join(lastOptions, this.subGrids[limitedOption.row][limitedOption.column].removeIfExtraOptions(limitedOption.options));
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index--) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeOptionsFromColumn(subGridColumn: number, subGridRow: number, cellColumn: number, options: number): IOption[] {
		let lastOptions: IOption[] = [];

		// Ignore subGridRow
		let row: number = Grid.rows;
		while (--row > subGridRow) {
				this.join(lastOptions, this.subGrids[row][subGridColumn].removeOptionsFromColumn(cellColumn, options));
		}
		while (row--) {
				this.join(lastOptions, this.subGrids[row][subGridColumn].removeOptionsFromColumn(cellColumn, options));
		}

		return lastOptions;
	}

	private removeOptionsFromRow(subGridColumn: number, subGridRow: number, cellRow: number, options: number): IOption[] {
		let lastOptions: IOption[] = [];

		// Ignore subGridColumn
		let column: number = Grid.columns;
		while (--column > subGridColumn) {
				this.join(lastOptions, this.subGrids[subGridRow][column].removeOptionsFromRow(cellRow, options));
		}

		while (column--) {
				this.join(lastOptions, this.subGrids[subGridRow][column].removeOptionsFromRow(cellRow, options));
		}

		return lastOptions;
	}

	private removeOnlyOptions(): boolean {
		return this.removeOnlyColumnOptions() || this.removeOnlyRowOptions() || this.removeOnlySubGridOptions();
	}

	private removeOnlyColumnOptions(): boolean {
		let onlyOptionFound: boolean = false;

		let matrix: number[][] = this.getTransposedAvailableOptionsMatrix();

		// Check for only options in each column
		let column: number = Grid.rows * Grid.columns;
		while (!onlyOptionFound && column--) {
			const {found, bit}: IOnlyOption = onlyOption(matrix[column]);
			if (found) {
				onlyOptionFound = true;
				let matrixRow: number = containingBitIndex(matrix[column], bit);	// Row within grid where only option found                     
				this.setByOption(column / Grid.rows >> 0, matrixRow / Grid.columns >> 0, column % Grid.rows, matrixRow % Grid.columns, bit, SetMethod.calculated);
			}
		}

		return onlyOptionFound;
	}

	private removeOnlyRowOptions(): boolean {
		let onlyOptionFound = false;

		let matrix = this.getAvailableOptionsMatrix();

		// Check for only options in each row
		let row = Grid.rows * Grid.columns;
		while (!onlyOptionFound && row--) {
			const {found, bit}: IOnlyOption = onlyOption(matrix[row]);
			if (found) {
				onlyOptionFound = true;
				let matrixColumn = containingBitIndex(matrix[row], bit);		// Column within grid where only option found                     
				this.setByOption(matrixColumn / Grid.rows >> 0, row / Grid.columns >> 0, matrixColumn % Grid.rows, row % Grid.columns, bit, SetMethod.calculated);
			}
		}

		return onlyOptionFound;
	}

	private removeOnlySubGridOptions(): boolean {
		let onlyOptionFound = false;

		// Check for only options in each sub grid
		let row = Grid.rows;
		while (!onlyOptionFound && row--) {
			let column = Grid.columns;
			while (!onlyOptionFound && column--) {
				const values = this.subGrids[row][column].getAvailableOptions();
				const {found, bit}: IOnlyOption = onlyOption(values);
				if (found) {
					onlyOptionFound = true;
					let arrayIndex = containingBitIndex(values, bit); // Index within array where only option found                     
					this.setByOption(column, row, arrayIndex % Grid.rows, arrayIndex / Grid.rows >> 0, bit, SetMethod.calculated);
				}
			}
		}

		return onlyOptionFound;
	}

	// Check options removed from other columns (n - 1) columns must have the options removed i.e. option must exist in only 1 column
	private removeOptionFromOtherColumns(subGridColumn: number, subGridRow: number, cellColumn: number, option: number): IOption[] {
		let lastOptions: IOption[] = [];

		let totalExistingColumns = 0;
		let totalExistingRows = 0;

		let existingColumn = -1;
		let column = Grid.rows;                                					// Use SubGrid's number of columns i.e. swopped rows
		while (totalExistingColumns < 2 && --column > cellColumn) {
			if (this.subGrids[subGridRow][subGridColumn].optionExistsInColumn(column, option)) {
				existingColumn = column;
				totalExistingColumns++;
			}
		}
		while (totalExistingColumns < 2 && column-- > 0) {
			if (this.subGrids[subGridRow][subGridColumn].optionExistsInColumn(column, option)) {
				existingColumn = column;
				totalExistingColumns++;
			}
		}

		if (totalExistingColumns === 1) {
				lastOptions = this.removeOptionsFromColumn(subGridColumn, subGridRow, existingColumn, option);
		} else {
			// Check other sub grids in same column
			let existingRow = -1;
			let row = Grid.rows;
			while (totalExistingRows < 2 && --row > subGridRow) {
				if (this.subGrids[row][subGridColumn].optionExistsInColumn(cellColumn, option)) {
					existingRow = row;
					totalExistingRows++;
				}
			}
			while (totalExistingRows < 2 && row-- > 0) {
				if (this.subGrids[row][subGridColumn].optionExistsInColumn(cellColumn, option)) {
					existingRow = row;
					totalExistingRows++;
				}
			}

			if (totalExistingRows === 1) {
				lastOptions = this.subGrids[existingRow][subGridColumn].removeOptionsExceptFromColumn(cellColumn, option);
			}
		}

		return lastOptions;
	}

	// Check options removed from other rows (n - 1) rows must have the options removed i.e. option must exist in only 1 row
	private removeOptionFromOtherRows(subGridColumn: number, subGridRow: number, cellRow: number, option: number): IOption[] {
		let lastOptions: IOption[] = [];

		let totalExistingColumns = 0;
		let totalExistingRows = 0;

		let existingRow = -1;
		let row = Grid.columns;                              						// Use SubGrid's number of rows i.e. swopped columns
		while (totalExistingRows < 2 && --row > cellRow) {
			if (this.subGrids[subGridRow][subGridColumn].optionExistsInRow(row, option)) {
				existingRow = row;
				totalExistingRows++;
			}
		}
		while (totalExistingRows < 2 && row-- > 0) {
			if (this.subGrids[subGridRow][subGridColumn].optionExistsInRow(row, option)) {
				existingRow = row;
				totalExistingRows++;
			}
		}

		if (totalExistingRows === 1) {
				lastOptions = this.removeOptionsFromRow(subGridColumn, subGridRow, existingRow, option);
		} else {
			// Check other sub grids in same row
			let existingColumn = -1;
			let column = Grid.columns;
			while (totalExistingColumns < 2 && --column > subGridColumn) {
				if (this.subGrids[subGridRow][column].optionExistsInRow(cellRow, option)) {
					existingColumn = column;
					totalExistingColumns++;
				}
			}
			while (totalExistingColumns < 2 && column-- > 0) {
				if (this.subGrids[subGridRow][column].optionExistsInRow(cellRow, option)) {
					existingColumn = column;
					totalExistingColumns++;
				}
			}

			if (totalExistingColumns === 1) {
				lastOptions = this.subGrids[subGridRow][existingColumn].removeOptionsExceptFromRow(cellRow, option);
			}
		}

		return lastOptions;
	}

	////////////////////////////////////////////////////////////////////////////////////////////
	// Convert sub grids to coluns * rows matrix
	////////////////////////////////////////////////////////////////////////////////////////////

	private getAvailableOptionsMatrix(): number[][] {              		// Get state of current grid - returned as an n*m matrix (not separated by sub grids)
		let subGridRow = Grid.rows;
		let matrixRow = subGridRow * Grid.columns;         							// Use SubGrid's number of rows i.e. swopped columns
		let matrix: number[][] = [];

		const subGridColumns = Grid.columns;
		// const matrixColumns = subGridColumns * Grid.rows;      					// Use SubGrid's number of columns i.e. swopped rows
		while (matrixRow--) {
			matrix[matrixRow] = [];
		}

		while (subGridRow--) {
			let subGridColumn = subGridColumns;
			while (subGridColumn--) {
				const subMatrix = this.subGrids[subGridRow][subGridColumn].getAvailableOptionsMatrix();

				let cellColumn = Grid.rows;
				while (cellColumn--) {
					let cellRow = Grid.columns;
					while (cellRow--) {
						matrix[subGridRow * Grid.columns + cellRow][subGridColumn * Grid.rows + cellColumn] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return matrix;
	}

	private getTransposedAvailableOptionsMatrix(): number[][] {   		// Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
		let subGridColumn = Grid.columns;
		let matrixColumn = subGridColumn * Grid.rows;          					// Use SubGrid's number of rows i.e. swopped columns
		let matrix: number[][] = [];

		let subGridRows = Grid.rows;
		// let matrixRows = subGridRows * Grid.columns;
		while (matrixColumn--) {
			matrix[matrixColumn] = [];
		}
	
		while (subGridColumn--) {
			let subGridRow = subGridRows;
			while (subGridRow--) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getAvailableOptionsMatrix();

				let cellRow = Grid.columns;
				while (cellRow--) {
					let cellColumn = Grid.rows;
					while (cellColumn--) {
						matrix[subGridColumn * Grid.rows + cellColumn][subGridRow * Grid.columns + cellRow] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return matrix;
	}

	private getCellsMatrix(): ICell[][] {                            	// Get cells in current grid - returned as an n*m matrix (not separated by sub grids)
		let subGridRow = Grid.rows;
		let matrixRow = subGridRow * Grid.columns;              				// Use SubGrid's number of rows i.e. swopped columns
		let matrix: ICell[][] = [];

		let subGridColumns = Grid.columns;
		// let matrixColumns = subGridColumns * Grid.rows;        					// Use SubGrid's number of columns i.e. swopped rows
		while (matrixRow--) {
			matrix[matrixRow] = [];
		}

		while (subGridRow--) {
			let subGridColumn = subGridColumns;
			while (subGridColumn--) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellColumn = Grid.rows;
				while (cellColumn--) {
					let cellRow = Grid.columns;
					while (cellRow--) {
						matrix[subGridRow * Grid.columns + cellRow][subGridColumn * Grid.rows + cellColumn] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return matrix;
	}

	private getTransposedCellsMatrix(): ICell[][] {                   // Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
		let subGridColumn = Grid.columns;
		let matrixColumn = subGridColumn * Grid.rows;           				// Use SubGrid's number of rows i.e. swopped columns
		let matrix: ICell[][] = [];

		let subGridRows = Grid.rows;
		// let matrixRows = subGridRows * Grid.columns;
		while (matrixColumn--) {
			matrix[matrixColumn] = [];
		}

		while (subGridColumn--) {
			let subGridRow = subGridRows;
			while (subGridRow--) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellRow = Grid.columns;
				while (cellRow--) {
					let cellColumn = Grid.rows;
					while (cellColumn--) {
						matrix[subGridColumn * Grid.rows + cellColumn][subGridRow * Grid.columns + cellRow] = subMatrix[cellRow][cellColumn];
					}
				}
			}
		}

		return matrix;
	}

	private join(a: any[], b: any[]) {
		Array.prototype.splice.apply(a, [0, 0].concat(b));              // Add first 2 arguments sent to splice i.e. start index and number of values to delete  
	}
}
