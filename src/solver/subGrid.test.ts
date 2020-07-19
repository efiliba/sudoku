import { Cell, ICell, SetMethod } from "./cell";
import { SubGrid, ISubGrid, IStruckOutCells, IOption } from "./subGrid";

describe("subGrid", () => {
	describe("2x4SubGrid", () => {
		it("should have a 2 x 4 sub grid created", () => {
			const columns = 2;
			const rows = 4;
			SubGrid.Constructor(columns, rows);
			const subGrid: ISubGrid = new SubGrid(0, 0);

			// Ensure a 2 x 4 sub grid created
			const expectedCells: ICell[][] = [];
			for (let row = 0; row < rows; row++) {
				expectedCells[row] = [];
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column] = new Cell(column, row);
				}
			}

			// expect(subGrid).toEqual(expectedCells);
			expect(subGrid.compare(expectedCells)).toBe(true);
		});
	});

	describe("4x2SubGrid", () => {
		let columns: number;
		let rows: number;
		let subGrid: ISubGrid;

		beforeEach(() => {
			columns = 4;
			rows = 2;
			SubGrid.Constructor(columns, rows);
			subGrid = new SubGrid(1, 3);                                  // Bottom right Cell of parent grid
		});

		it("should have a 4 x 2 sub grid created", () => {
			const expectedCells: ICell[][] = [];
			for (let row = 0; row < rows; row++) {
				expectedCells[row] = [];
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column] = new Cell(column, row);
				}
			}

			expect(subGrid.compare(expectedCells)).toBe(true);

			expect(subGrid.get(0, 0).options).toBe(255);
			expect(subGrid.get(1, 0).options).toBe(255);
			expect(subGrid.get(2, 0).options).toBe(255);
			expect(subGrid.get(3, 0).options).toBe(255);
			expect(subGrid.get(0, 1).options).toBe(255);
			expect(subGrid.get(1, 1).options).toBe(255);
			expect(subGrid.get(2, 1).options).toBe(255);
			expect(subGrid.get(3, 1).options).toBe(255);
		});

		it("should be solved", () => {
			subGrid.setByPosition(0, 0, 0, 0, SetMethod.user);
			subGrid.setByOption(1, 0, 2, SetMethod.user);
			subGrid.setByPosition(2, 0, 2, 0, SetMethod.loaded);
			subGrid.setByOption(3, 0, 4, SetMethod.loaded);
			subGrid.setByOption(0, 1, 8, SetMethod.loaded);
			subGrid.setByPosition(1, 1, 1, 1, SetMethod.loaded);
			subGrid.setByOption(2, 1, 32, SetMethod.user);
			subGrid.setByPosition(3, 1, 3, 1, SetMethod.user);

			expect(subGrid.solved()).toBe(true);
		});
	});

	describe("Remove options", () => {
		let columns: number;
		let rows: number;
		let subGrid: ISubGrid;
		let expectedCells: ICell[][];

		it("should have a 3 x 2 sub grid created", () => {
			columns = 3;
			rows = 2;
			SubGrid.Constructor(columns, rows);            
			subGrid = new SubGrid(0, 0);

			expectedCells = [];
			for (let row = 0; row < rows; row++) {
				expectedCells[row] = [];
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column] = new Cell(column, row);
				}
			}

			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should have 1 removed from all cells except top left cell", () => {
			// Remove 1 from all cells except top left cell - check 1 removed from other cells
			let removeBit = 1;
			let testColumn = 0;
			let testRow = 0;

			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			expect(struckOutCells.lastOptionsFound.length).toBe(0);       // No last options found

			const removeFromColumn: IOption[] = struckOutCells.removedOptionsFromColumn;	// Remove 1 from columns 2 and 1
			expect(removeFromColumn.length).toBe(2);
			expect(removeFromColumn[0].cellColumn).toBe(2);
			expect(removeFromColumn[0].bits).toBe(removeBit);
			expect(removeFromColumn[1].cellColumn).toBe(1);
			expect(removeFromColumn[1].bits).toBe(removeBit);

			const removeFromRow: IOption[] = struckOutCells.removedOptionsFromRow;	// Remove 1 from row 1
			expect(removeFromRow.length).toBe(1);
			expect(removeFromRow[0].cellRow).toBe(removeBit);
			expect(removeFromColumn[0].bits).toBe(removeBit);

			for (let row = 0; row < rows; row++) {
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column].removeOption(removeBit);
				}
			}
			expectedCells[testRow][testColumn].reset();                   // No options removed
			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should also have 2 removed from all cells except top middle cell", () => {
			let removeBit = 2;
			let testColumn = 1;
			let testRow = 0;

			// Remove 2 from all cells except top middle cell - check 1 & 2 removed from other cells
			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			expect(struckOutCells.lastOptionsFound.length).toBe(0);				// No last options found

			const removeFromColumn: IOption[] = struckOutCells.removedOptionsFromColumn;	// Remove 2 from columns 2 and 0
			expect(removeFromColumn.length).toBe(2);
			expect(removeFromColumn[0].cellColumn).toBe(2);
			expect(removeFromColumn[0].bits).toBe(removeBit);
			expect(removeFromColumn[1].cellColumn).toBe(0);
			expect(removeFromColumn[1].bits).toBe(removeBit);

			const removeFromRow: IOption[] = struckOutCells.removedOptionsFromRow;	// Remove 2 from row 1
			expect(removeFromRow.length).toBe(1);
			expect(removeFromRow[0].cellRow).toBe(1);
			expect(removeFromColumn[0].bits).toBe(removeBit);

			for (let row = 0; row < rows; row++) {
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column].removeOption(removeBit);
				}
			}
			expectedCells[testRow][testColumn].reset();
			expectedCells[testRow][testColumn].removeOption(1);						// Remove previous bit
			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should have 4 removed from all cells except top right cell", () => {
			// Remove 4 from top right cell
			let removeBit = 4;
			let testColumn = 2;
			let testRow = 0;

			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			expect(struckOutCells.lastOptionsFound.length).toBe(0);				// No last options found

			const removeFromColumn: IOption[] = struckOutCells.removedOptionsFromColumn;	// Remove 4 from columns 1 and 0
			expect(removeFromColumn.length).toBe(2);
			expect(removeFromColumn[0].cellColumn).toBe(1);
			expect(removeFromColumn[0].bits).toBe(removeBit);
			expect(removeFromColumn[1].cellColumn).toBe(0);
			expect(removeFromColumn[1].bits).toBe(removeBit);

			const removeFromRow: IOption[] = struckOutCells.removedOptionsFromRow;	// Remove 4 from row 1
			expect(removeFromRow.length).toBe(1);
			expect(removeFromRow[0].cellRow).toBe(1);
			expect(removeFromColumn[0].bits).toBe(removeBit);

			for (let row = 0; row < rows; row++) {
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column].removeOption(removeBit);
				}
			}
			expectedCells[testRow][testColumn].reset();
			expectedCells[testRow][testColumn].removeOptions(1 + 2);			// Remove previous bits

			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should have 8 removed from all cells except bottom left cell", () => {
			// Remove 8 from bottom left cell
			let removeBit = 8;
			let testColumn = 0;
			let testRow = 1;

			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			expect(struckOutCells.lastOptionsFound.length).toBe(0);				// No last options found

			const removeFromColumn: IOption[] = struckOutCells.removedOptionsFromColumn;	// Remove 8 from columns 2 and 1
			expect(removeFromColumn.length).toBe(2);
			expect(removeFromColumn[0].cellColumn).toBe(2);
			expect(removeFromColumn[0].bits).toBe(removeBit);
			expect(removeFromColumn[1].cellColumn).toBe(1);
			expect(removeFromColumn[1].bits).toBe(removeBit);

			const removeFromRow: IOption[] = struckOutCells.removedOptionsFromRow;	// Remove 8 from row 0
			expect(removeFromRow.length).toBe(1);
			expect(removeFromRow[0].cellRow).toBe(0);
			expect(removeFromColumn[0].bits).toBe(removeBit);

			for (let row = 0; row < rows; row++) {
				for (let column = 0; column < columns; column++) {
					expectedCells[row][column].removeOption(removeBit);
				}
			}
			expectedCells[testRow][testColumn].reset();
			expectedCells[testRow][testColumn].removeOptions(1 + 2 + 4);	// Remove previous bits

			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should have 16 removed from all cells except bottom middle cell", () => {
			// Remove 16 from bottom middle cell
			let removeBit = 16;
			let testColumn = 1;
			let testRow = 1;

			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			const lastOptions: IOption[] = struckOutCells.lastOptionsFound;
			expect(lastOptions.length).toBe(1);                           // A last option was found
			expect(lastOptions[0].cellColumn).toBe(2);                    // (2, 1) must be 6
			expect(lastOptions[0].cellRow).toBe(1);
			expect(lastOptions[0].bits).toBe(32);

			const removeFromColumn: IOption[] = struckOutCells.removedOptionsFromColumn;	// Remove 16 from columns 2 and 0
			expect(removeFromColumn.length).toBe(2);
			expect(removeFromColumn[0].cellColumn).toBe(2);

			expect(removeFromColumn[0].bits).toBe(removeBit);
			expect(removeFromColumn[1].cellColumn).toBe(0);
			expect(removeFromColumn[1].bits).toBe(removeBit);

			const removeFromRow: IOption[] = struckOutCells.removedOptionsFromRow;	// Remove 16 from row 0
			expect(removeFromRow.length).toBe(1);
			expect(removeFromRow[0].cellRow).toBe(0);
			expect(removeFromColumn[0].bits).toBe(removeBit);

			for (let row = 0; row < rows; row++) {               	//  33 | 34 | 36        (1,6) | (2,6) | (3,6)
				for (let column = 0; column < columns; column++) {  //  ------------    =   --------------------- 
					expectedCells[row][column].removeOption(removeBit);     	//  40 | 48 | 32        (4,6) | (5,6) |  (6)
				}                   																				//
			}																															// i.e. remove 6 from other cells to solve sub grid
			expectedCells[testRow][testColumn].reset();
			expectedCells[testRow][testColumn].removeOptions(1 + 2 + 4 + 8);

			expect(subGrid.compare(expectedCells)).toBe(true);
		});

		it("should have 6 set in bottom right cell and solved", () => {
			// Set cells to those in last options found - i.e. 6 = 32 in bottom right cell
			let removeBit = 32;
			let testColumn = 2;
			let testRow = 1;

			expect(subGrid.solved()).toBeFalsy();                     		// Not solved yet
			expect(subGrid.get(testColumn, testRow).setMethod).not.toBeNull();

			const struckOutCells: IStruckOutCells = subGrid.strikeOutCell(testColumn, testRow, removeBit);
			const lastOptions: IOption[] = struckOutCells.lastOptionsFound;
			expect(lastOptions.length).toBe(5);                         	// A last option was found
			expect(lastOptions[0].cellColumn).toBe(1);                    // (1, 1) must be 5
			expect(lastOptions[0].cellRow).toBe(1);
			expect(lastOptions[0].bits == 16);  
			expect(lastOptions[1].cellColumn).toBe(0);                    // (0, 1) must be 4
			expect(lastOptions[1].cellRow).toBe(1);
			expect(lastOptions[1].bits).toBe(8);   
			expect(lastOptions[2].cellColumn).toBe(2);                    // (2, 0) must be 3
			expect(lastOptions[2].cellRow).toBe(0);
			expect(lastOptions[2].bits).toBe(4);   
			expect(lastOptions[3].cellColumn).toBe(1);                    // (1, 0) must be 2
			expect(lastOptions[3].cellRow).toBe(0);
			expect(lastOptions[3].bits).toBe(2);   
			expect(lastOptions[4].cellColumn).toBe(0);                    // (0, 0) must be 1
			expect(lastOptions[4].cellRow).toBe(0);
			expect(lastOptions[4].bits).toBe(1);   

			expect(struckOutCells.removedOptionsFromColumn.length).toBe(0);	// No options to remove from column nor row
			expect(struckOutCells.removedOptionsFromRow.length).toBe(0);

			expect(subGrid.toJson()).toEqual({
				rows:
				[
					{ columns: [{ symbol: '1' }, { symbol: '2' }, { symbol: '3' }] },
					{ columns: [{ symbol: '4' }, { symbol: '5' }, { symbol: '6' }] }
				]
			});

			expect(subGrid.solved()).toBe(true);                        	// Sub grid solved
		});

		it("should be solved", () => {
			// Re-check - cells set by their position 
			expectedCells[0][0].setByPosition(0, 0, SetMethod.user);     	// Cells transposed to sub-grid i.e. n x m -> m x n
			expectedCells[0][1].setByPosition(1, 0, SetMethod.user);
			expectedCells[0][2].setByPosition(0, 1, SetMethod.user);
			expectedCells[1][0].setByPosition(1, 1, SetMethod.user);
			expectedCells[1][1].setByPosition(0, 2, SetMethod.user);
			expectedCells[1][2].setByPosition(1, 2, SetMethod.user);
			expect(subGrid.compare(expectedCells)).toBe(true);
		});
	});

    describe("2x2SubGridCells", () => {
			it("should be solved", () => {
				const columns = 2;
				const rows = 2;
				SubGrid.Constructor(columns, rows);
				const subGrid: ISubGrid = new SubGrid(0, 0);

				// Ensure a 2 x 2 sub grid created
				const expectedCells: ICell[][] = [];
				for (let row = 0; row < rows; row++) {
					expectedCells[row] = [];
					for (let column = 0; column < columns; column++) {
						expectedCells[row][column] = new Cell(column, row);
					}
				}
				expect(subGrid.compare(expectedCells)).toBe(true);

				subGrid.setByPosition(0, 0, 0, 0, SetMethod.user);        	// Top left cell set to 1
				subGrid.setByPosition(1, 0, 1, 0, SetMethod.user);          // Top right cell set to 2
				subGrid.setByPosition(0, 1, 0, 1, SetMethod.user);          // Bottom left cell set to 4
				expect(subGrid.get(1, 1).options).toBe(15);                 // Nothing removed from bottom right cell
				expect(subGrid.solved()).toBeFalsy();

				subGrid.simplify();
				expect(subGrid.get(1, 1).options).toBe(8);                  // Only option 8 (symbol 4) left 
				expect(subGrid.solved()).toBe(true);
			});
    });

    describe("2x3SubGridCells", () => {
			it("should be simplified", () => {
				const columns = 2;
				const rows = 3;
				SubGrid.Constructor(columns, rows);
				const subGrid: ISubGrid = new SubGrid(0, 0);

				// Ensure a 2 x 3 sub grid created
				const expectedCells: ICell[][] = [];
				for (let row = 0; row < rows; row++) {
					expectedCells[row] = [];
					for (let column = 0; column < columns; column++) {
						expectedCells[row][column] = new Cell(column, row);
					}
				}
				expect(subGrid.compare(expectedCells)).toBe(true);

//            expect('ToDo').toBe('Not Finished yet');

				subGrid.get(0, 0).setByPosition(0, 0, SetMethod.loaded);		// Top left cell set to 1

				//topLeftSubGrid[0, 0].set(1);
				//topLeftSubGrid[1, 0].set(2);
				//topLeftSubGrid.simplify(); return ICell[][]
			});
    });

	describe("Json", () => {
		describe("1x2", () => {
			const columns = 1;
			const rows = 2;
			let subGrid: ISubGrid;

			it("should be setup", () => {
				SubGrid.Constructor(columns, rows);
				subGrid = new SubGrid(0, 0);
				expect(subGrid.toJson()).toEqual({
					rows:
					[
						{ columns: [{ rows: [{ columns: [{ symbol: '1' }, { symbol: '2' }] }] }] },
						{ columns: [{ rows: [{ columns: [{ symbol: '1' }, { symbol: '2' }] }] }] }
					]
				});
			});

			it("should have cell set", () => {
				subGrid.setByOption(0, 0, 1, SetMethod.user);
				expect(subGrid.toJson()).toEqual({
					rows:
					[
						{ columns: [{ symbol: '1', setMethod: SetMethod.user }] },
						{ columns: [{ rows: [{ columns: [{ symbol: '1' }, { symbol: '2' }] }] }] }
					]
				});
			});

			it("should be solved", () => {
				subGrid.simplify();
				expect(subGrid.toJson()).toEqual({
					rows:
					[
						{ columns: [{ symbol: '1', setMethod: SetMethod.user }] },
						{ columns: [{ symbol: '2' }] }
					]
				});
			});
		});

		describe("2x2", () => {
			const columns = 2;
			const rows = 2;
			let subGrid: ISubGrid;

			it("should be setup", () => {
				SubGrid.Constructor(columns, rows);
				subGrid = new SubGrid(0, 0);

				expect(subGrid.toJson()).toEqual({
					//#region 2x2 JSON Grid
					rows:
					[
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								},
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						},
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								},
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						}
					]
					//#endregion
				});
			});

			it("should have top left cell set", () => {                   // Other cells not struck out
				subGrid.setByPosition(0, 0, 0, 0, SetMethod.user);

				expect(subGrid.toJson()).toEqual({
					//#region 2x2 JSON Grid
					rows:
					[
						{
							columns:
							[
								{ symbol: '1', setMethod: SetMethod.user },
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						},
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								},
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						}
					]
					//#endregion
				});
			});

			it("should have other cells set", () => {
				subGrid.setByOption(1, 0, 2, SetMethod.loaded);
				subGrid.setByPosition(0, 1, 0, 1, SetMethod.loaded);
				expect(subGrid.toJson()).toEqual({
					rows:
					[
						{
							columns:
							[
								{ symbol: '1', setMethod: SetMethod.user },
								{ symbol: '2', setMethod: SetMethod.loaded }
							]
						},
						{
							columns:
							[
								{ symbol: '3', setMethod: SetMethod.loaded },
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						}
					]
				});
			});

			it("should be solved", () => {
				subGrid.simplify();
				expect(subGrid.toJson()).toEqual({
					rows:
					[
						{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '2', setMethod: SetMethod.loaded }] },
						{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '4' }] }
					]
				});
			});
		});

		describe("Set", () => {
			let columns = 2;
			let rows = 2;
			let subGrid: ISubGrid;

			it("should have 1 symbol set", () => {
				SubGrid.Constructor(columns, rows);
				subGrid = new SubGrid(0, 0);

				const json = {
					//#region 2x2 JSON Grid
					rows:
					[
						{
							columns:
							[
								{ symbol: '1' },
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						},
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								},
								{
									rows:
									[
										{ columns: [{ symbol: '1' }, { symbol: '2' }] },
										{ columns: [{ symbol: '3' }, { symbol: '4' }] }
									]
								}
							]
						}
					]
					//#endregion
				}

				subGrid.setJson(json);
				expect(subGrid.toJson()).toEqual(json);
			});

			it("should be solved", () => {
				const json = {
					rows:
					[
						{ columns: [{ symbol: '1' }, { symbol: '2' }] },
						{ columns: [{ symbol: '3' }, { symbol: '4' }] }
					]
				}

				subGrid.setJson(json);
				expect(subGrid.toJson()).toEqual(json);
				expect(subGrid.solved()).toBe(true);
			});
		});
	});
});
