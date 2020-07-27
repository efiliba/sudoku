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
	loadPuzzle(symbolPositions: number[]): void;
	loadOptions(options: number[]): void;
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
		for (let row = 0; row < Grid.rows; row++) {
			this.subGrids[row] = [];
			for (let column = 0; column < Grid.columns; column++) {
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
		for (let row = 0; row < Grid.rows; row++) {
			const jsonSubGrids: IJsonCell[] = [];
			for (let column = 0; column < Grid.columns; column++) {
				jsonSubGrids.push(this.subGrids[row][column].toJson());
			}
			json.rows.push({ columns: jsonSubGrids });
		}

		return json;
	}

	public setJson(json: IJsonGrid, simplify: boolean = false) {
		// Set sub grids' json values  
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			const jsonColumns: IJsonSubGrid[] = json.rows[subGridRow].columns;
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
					this.subGrids[subGridRow][subGridColumn].setJson(jsonColumns[subGridColumn]);
			}
		}

		if (simplify) {
			this.strikeOutFromSetCells();
		}
	}

	private strikeOutFromSetCells() {
		this.totalSet = 0;
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				const subGrid = this.subGrids[subGridRow][subGridColumn];
				for (let cellRow = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn = 0; cellColumn < Grid.rows; cellColumn++) {
						const cell = subGrid.get(cellColumn, cellRow);
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
		let match = true;
		let row = Grid.rows;
		while (match && row-- > 0) {
			let column = Grid.columns;
			while (match && column-- > 0) {
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
		let solved = true;

		let row = Grid.rows;
		while (solved && row-- > 0) {
			let column = Grid.columns;
			while (solved && column-- > 0) {
				solved = this.subGrids[row][column].solved();
			}
		}

		return solved;
	}

	public removeOptionAtPosition(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, optionColumn: number, optionRow: number): boolean {
		const cell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);
		if (cell.removeOptionAtPosition(optionColumn, optionRow)) {			// Check if last option left
			this.totalSet++;
			this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, cell.options);	// Remaining option
			return true;
		} else {
			return false;
		}
	}

	public removeOption(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number): boolean {
		let cell = this.subGrids[subGridRow][subGridColumn].get(cellColumn, cellRow);

		if (cell.removeOption(option)) {                     						// Check if last option left
			this.totalSet++;
			this.strikeOut(subGridColumn, subGridRow, cellColumn, cellRow, cell.options);	// Remaining option
			return true;
		} else {
			return false;
		}
	}

	public simplify(): boolean {
		let onlyOptionFound = false;

		// Check/remove only options in columns/rows/sub-grids and mulitipe options limited to a certain number of related cells i.e. if 2 cells in a row can only contain 1 or 2 => remove from other cells in row 
		while (this.removeOnlyOptions() || this.checkLimitedOptions()) {
			onlyOptionFound = true;
		}

		return onlyOptionFound;
	}

	public debug(log: boolean = true): DebugSubGridType[][] {
		const rows: DebugSubGridType[][] = [];

		let row = Grid.rows;
		while (row-- > 0) {
			let column = Grid.columns;
			const subGridsRow: DebugSubGridType[] = [];
			while (column-- > 0) {
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
		// Check columns and rows contain all options and no set cell duplicted
		return this.matrixValid(this.getTransposedCellsMatrix()) && this.matrixValid(this.getCellsMatrix());
	}

	private matrixValid(matrix: ICell[][]): boolean {
		let valid = true;
		const size = Grid.columns * Grid.rows;
		let index = size;
		while (valid && index-- > 0) {
			let setOptions = this.setDistinctOptions(matrix[index]);			// Get unique set cells
			let unsetOptions = this.unsetOptions(matrix[index]);

			valid = setOptions.length + unsetOptions.length === size &&   // Ensures setOptions did not contain duplicates
				(bitwiseOR(setOptions) | bitwiseOR(unsetOptions)) === (1 << size) - 1; // totalSetOptions | totalUnsetOptions must contain all the options
		}

		return valid;
	}

	private setDistinctOptions(cells: ICell[]): number[] {
		// cells.Where(x => x.IsSet).GroupBy(x => x.Options).Where(x => x.Count() == 1).Select(x => x.Key);
		let distinct: number[] = [];
		let hash = {};
		for (let index = 0; index < cells.length; index++) {
			let options = cells[index].options;
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
		for (let index = 0; index < cells.length; index++) {
			if (!cells[index].setMethod) {                       					// cell unset i.e. == SetMethod.unset
				options.push(cells[index].options);
			}
		}

		return options;
	}

	private load(cells: ICell[]) {
		const subGrid: ICell[][] = [];
		for (let row = 0; row < Grid.columns; row++) {       						// Use SubGrid's number of rows i.e. swopped columns
				subGrid[row] = [];
		}
		let size = Grid.columns * Grid.rows;

		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn = 0; cellColumn < Grid.rows; cellColumn++) {
						subGrid[cellRow][cellColumn] = cells[subGridRow * size * Grid.columns + subGridColumn * Grid.rows + cellRow * size + cellColumn];
					}
				}

				this.subGrids[subGridRow][subGridColumn].setCells(subGrid);
			}
		}
	}

	public save(): ICell[] {
		let size= Grid.columns * Grid.rows;
		let cells: ICell[] = [];

		for (let subGridRow= 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn= 0; subGridColumn < Grid.columns; subGridColumn++) {
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

	public loadPuzzle(symbolPositions: number[]) {
		const size = Grid.columns * Grid.rows;
		const grouped = groupBy(symbolPositions, size);
		const transposed: number[][][] = transposeRows(Grid.columns, grouped);

		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				this.subGrids[subGridRow][subGridColumn].loadSymbolPositions(transposed[subGridRow][subGridColumn]);
			}
		}
	}

	public loadOptions(options: number[]) {
		const size = Grid.columns * Grid.rows;
		const grouped = groupBy(options, size);

		let index = 0;
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				this.subGrids[subGridRow][subGridColumn].loadOptions(grouped[index++])
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
		let cells = this.save();                           							// Save current state
		let saveTotalSet = this.totalSet;

		let valid = true;
		let totalUnsetOptions = 1;
		while (valid && ++totalUnsetOptions < unsetOptionsDepth) {
			let row = Grid.rows;
			while (valid && row-- > 0) {
				let column = Grid.columns;
				while (valid && column-- > 0) {
					const unsetCells = this.unsetCells(column, row, totalUnsetOptions);	// May reduce column and row indices
					column = unsetCells.column;
					row = unsetCells.row;

					let index = unsetCells.cells.length;
					while (valid && index-- > 0) {
						let cell = unsetCells.cells[index];

						let options = cell.options;
						let cellColumn = cell.getColumn();
						const cellRow = cell.getRow();

						let tryOption = options & ~(options - 1);								// lowest set bit value
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

			if (!set && row-- > 0) {
				column = Grid.columns - 1;
			}
		}

		return { column, row, cells };
	}

	public strikeOut(subGridColumn: number, subGridRow: number, cellColumn: number, cellRow: number, option: number) {
		let struckOutCells = this.subGrids[subGridRow][subGridColumn].strikeOutCell(cellColumn, cellRow, option);
		let removeOption: IOption;

		let index = struckOutCells.removedOptionsFromColumn.length; 		// Distinct
		while (index-- > 0) {  
			removeOption = struckOutCells.removedOptionsFromColumn[index];
			this.join(struckOutCells.lastOptionsFound, this.removeOptionFromOtherColumns(removeOption.subGridColumn, removeOption.subGridRow, removeOption.cellColumn, removeOption.bits));
		}

		index = struckOutCells.removedOptionsFromRow.length;
		while (index-- > 0) {  
			removeOption = struckOutCells.removedOptionsFromRow[index];
			this.join(struckOutCells.lastOptionsFound, this.removeOptionFromOtherRows(removeOption.subGridColumn, removeOption.subGridRow, removeOption.cellRow, removeOption.bits));
		}

		this.join(struckOutCells.lastOptionsFound, this.removeOptionsFromColumn(subGridColumn, subGridRow, cellColumn, option));
		this.join(struckOutCells.lastOptionsFound, this.removeOptionsFromRow(subGridColumn, subGridRow, cellRow, option));

		let lastOption: IOption;
		index = struckOutCells.lastOptionsFound.length;
		while (index-- > 0) {
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
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn = 0; cellColumn < Grid.rows; cellColumn++) {
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
		for (let subGridRow = 0; subGridRow < Grid.rows; subGridRow++) {
			for (let subGridColumn = 0; subGridColumn < Grid.columns; subGridColumn++) {
				for (let cellRow = 0; cellRow < Grid.columns; cellRow++) {
					for (let cellColumn = 0; cellColumn < Grid.rows; cellColumn++) {
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
		const cells = this.getCellsArray();
		for (let index = 0; index < cells.length; index-- > 0) {
			fixedCells.push(cells[index].setMethod === SetMethod.loaded || cells[index].setMethod === SetMethod.user ? cells[index].options : 0);	// Get fixed cells i.e. 0, 0, 0, 8, 4, 0, 0, 1, ...
		}

		this.reset();
		this.fixByOptions(fixedCells);
		this.solve();
	}

	private getCellsArray(): ICell[] {
		let array: ICell[] = [];

		let subGridRow = Grid.rows;
		while (subGridRow-- > 0) {
			let subGridColumn = Grid.columns;
			while (subGridColumn-- > 0) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellColumn = Grid.rows;
				while (cellColumn-- > 0) {
					let cellRow = Grid.columns;
					while (cellRow-- > 0) {
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
		let index = lastOptions.length;
		while (index-- > 0) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		return lastOptions !== null;
	}

	// Check for mulitipe options limited to a certain number of related cells i.e. 2 cells in a row can only contain 1 or 2 => remove from other cells in row
	private checkLimitedOptions(): boolean {
		let limitedOptions = this.findOptionsLimitedToMatrix(this.getTransposedCellsMatrix());// Columns
		let limitedOptionFound = this.removeIfExtraOptionsFromColumn(limitedOptions);  // Remove options iff the cell contains other options

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

		for (let cellIndex = 0; cellIndex < Grid.columns * Grid.rows; cellIndex++) {
			while (unsetCells.length) {                               		// Clear array
				unsetCells.pop();
			}

			// IEnumerable<Cell> unsetCells = cells[index].Where(x => !x.IsSet);	// Get cells that are still to be set
			let checkCells = cells[cellIndex];
			let index = checkCells.length;
			while (index-- > 0) {
				if (!checkCells[index].setMethod)                      			// cell unset i.e. == SetMethod.unset
					unsetCells.push(checkCells[index]);
			}
			let totalUnsetCells = unsetCells.length;

			// Find max remaining options, less than totalUnsetCells
			// int maxRemainingOptions = unsetCells.Where(x => x.TotalOptionsRemaining < totalUnsetCells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < totalUnsetCells
			let maxRemainingOptions = 0;
			index = totalUnsetCells;
			while (index-- > 0) {
				let totalOptionsRemaining = unsetCells[index].totalOptionsRemaining;
				if (totalOptionsRemaining < totalUnsetCells && totalOptionsRemaining > maxRemainingOptions)
					maxRemainingOptions = totalOptionsRemaining;
			}

			let found = false;
			let pick = 1;
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
				while (index-- > 0) {
					if (unsetCells[index].totalOptionsRemaining <= pick) {
						pickOptions.push(unsetCells[index]);
					}
				}

				let combinations = Grid.combinations.select(pickOptions, pick);
				index = combinations.length;
				while (!found && index-- > 0) {
					// int removeOptions = BitwiseOR(enumerator.Current.Select(x => x.Options));
					let combinationsIndex = combinations[index].length;
					while (combinationsIndex-- > 0) {
						combinationOptions.push(combinations[index][combinationsIndex].options);
					}
					let removeOptions = bitwiseOR(combinationOptions);

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

		for (let row = 0; row < Grid.rows; row++) {
			for (let column = 0; column < Grid.columns; column++) {
				let unsetCells = this.subGrids[row][column].getUnsetCells();
				let totalUnsetCells = unsetCells.length;

				// int maxRemainingOptions = unsetCells.Where(x => x.TotalOptionsRemaining < totalUnsetCells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < totalUnsetCells
				let maxRemainingOptions = 0;
				let index = totalUnsetCells;
				while (index-- > 0) {
					const totalOptionsRemaining = unsetCells[index].totalOptionsRemaining;
					if (totalOptionsRemaining < totalUnsetCells && totalOptionsRemaining > maxRemainingOptions) {
						maxRemainingOptions = totalOptionsRemaining;
					}
				}

				let found = false;
				let pick = 1;
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
					while (index-- > 0) {
						if (unsetCells[index].totalOptionsRemaining <= pick) {
							pickOptions.push(unsetCells[index]);
						}
					}

					let combinations = Grid.combinations.select(pickOptions, pick);
					index = combinations.length;
					while (!found && index-- > 0) {
						// int removeOptions = BitwiseOR(enumerator.Current.Select(x => x.Options));
						let combinationsIndex = combinations[index].length;
						while (combinationsIndex-- > 0) {
							combinationOptions.push(combinations[index][combinationsIndex].options);
						}
						let removeOptions = bitwiseOR(combinationOptions);

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
		let index = limitedOptions.length;
		while (index-- > 0) {
			limitedOption = limitedOptions[index];
			for (let row = 0; row < Grid.rows; row++) {
				this.join(lastOptions, this.subGrids[row][limitedOption.column / Grid.rows >> 0].removeIfExtraOptionsFromColumn(limitedOption.column % Grid.rows, limitedOption.options));
			}
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index-- > 0) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeIfExtraOptionsFromRow(limitedOptions: ILimitedOption[]): boolean {
		let lastOptions: IOption[] = [];

		let limitedOption: ILimitedOption;
		let index = limitedOptions.length;
		while (index-- > 0) {
			limitedOption = limitedOptions[index];
			for (let column = 0; column < Grid.columns; column++) {
					this.join(lastOptions, this.subGrids[limitedOption.row / Grid.columns >> 0][column].removeIfExtraOptionsFromRow(limitedOption.row % Grid.columns, limitedOption.options));
			}
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index-- > 0) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeIfExtraOptionsFromSubGrid(limitedOptions: ILimitedOption[]): boolean {
		let lastOptions: IOption[] = [];

		let limitedOption: ILimitedOption;
		let index = limitedOptions.length;
		while (index-- > 0) {
			limitedOption = limitedOptions[index];
			this.join(lastOptions, this.subGrids[limitedOption.row][limitedOption.column].removeIfExtraOptions(limitedOption.options));
		}

		let lastOption: IOption;
		index = lastOptions.length;
		while (index-- > 0) {
			lastOption = lastOptions[index];
			this.strikeOut(lastOption.subGridColumn, lastOption.subGridRow, lastOption.cellColumn, lastOption.cellRow, lastOption.bits);
		}

		this.totalSet += lastOptions.length;
		return lastOptions.length > 0;
	}

	private removeOptionsFromColumn(subGridColumn: number, subGridRow: number, cellColumn: number, options: number): IOption[] {
		let lastOptions: IOption[] = [];

		// Ignore subGridRow
		let row = Grid.rows;
		while (--row > subGridRow) {
				this.join(lastOptions, this.subGrids[row][subGridColumn].removeOptionsFromColumn(cellColumn, options));
		}
		while (row-- > 0) {
				this.join(lastOptions, this.subGrids[row][subGridColumn].removeOptionsFromColumn(cellColumn, options));
		}

		return lastOptions;
	}

	private removeOptionsFromRow(subGridColumn: number, subGridRow: number, cellRow: number, options: number): IOption[] {
		let lastOptions: IOption[] = [];

		// Ignore subGridColumn
		let column = Grid.columns;
		while (--column > subGridColumn) {
				this.join(lastOptions, this.subGrids[subGridRow][column].removeOptionsFromRow(cellRow, options));
		}

		while (column-- > 0) {
				this.join(lastOptions, this.subGrids[subGridRow][column].removeOptionsFromRow(cellRow, options));
		}

		return lastOptions;
	}

	private removeOnlyOptions(): boolean {
		return this.removeOnlyColumnOptions() || this.removeOnlyRowOptions() || this.removeOnlySubGridOptions();
	}

	private removeOnlyColumnOptions(): boolean {
		let onlyOptionFound = false;

		let matrix = this.getTransposedAvailableOptionsMatrix();

		// Check for only options in each column
		let column = Grid.rows * Grid.columns;
		while (!onlyOptionFound && column-- > 0) {
			const {found, bit} = onlyOption(matrix[column]);
			if (found) {
				onlyOptionFound = true;
				let matrixRow = containingBitIndex(matrix[column], bit);	// Row within grid where only option found                     
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
		while (!onlyOptionFound && row-- > 0) {
			const {found, bit} = onlyOption(matrix[row]);
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
		while (!onlyOptionFound && row-- > 0) {
			let column = Grid.columns;
			while (!onlyOptionFound && column-- > 0) {
				const values = this.subGrids[row][column].getAvailableOptions();
				const {found, bit} = onlyOption(values);
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
		while (matrixRow-- > 0) {
			matrix[matrixRow] = [];
		}

		while (subGridRow-- > 0) {
			let subGridColumn = subGridColumns;
			while (subGridColumn-- > 0) {
				const subMatrix = this.subGrids[subGridRow][subGridColumn].getAvailableOptionsMatrix();

				let cellColumn = Grid.rows;
				while (cellColumn-- > 0) {
					let cellRow = Grid.columns;
					while (cellRow-- > 0) {
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
		while (matrixColumn-- > 0) {
			matrix[matrixColumn] = [];
		}
	
		while (subGridColumn-- > 0) {
			let subGridRow = subGridRows;
			while (subGridRow-- > 0) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getAvailableOptionsMatrix();

				let cellRow = Grid.columns;
				while (cellRow-- > 0) {
					let cellColumn = Grid.rows;
					while (cellColumn-- > 0) {
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
		while (matrixRow-- > 0) {
			matrix[matrixRow] = [];
		}

		while (subGridRow-- > 0) {
			let subGridColumn = subGridColumns;
			while (subGridColumn-- > 0) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellColumn = Grid.rows;
				while (cellColumn-- > 0) {
					let cellRow = Grid.columns;
					while (cellRow-- > 0) {
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
		while (matrixColumn-- > 0) {
			matrix[matrixColumn] = [];
		}

		while (subGridColumn-- > 0) {
			let subGridRow = subGridRows;
			while (subGridRow-- > 0) {
				let subMatrix = this.subGrids[subGridRow][subGridColumn].getCellsMatrix();

				let cellRow = Grid.columns;
				while (cellRow-- > 0) {
					let cellColumn = Grid.rows;
					while (cellColumn-- > 0) {
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
