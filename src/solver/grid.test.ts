import {Grid, IGrid} from "./grid";
import {SubGrid, ISubGrid} from "./subGrid";
import {SetMethod, Cell, ICell} from "./cell";

describe("Grid", () => {
	describe("1x2", () => {
		it("should persist save", () => {
			const columns: number = 1;
			const rows: number = 2;
			Grid.Constructor(columns, rows);
			const grid: IGrid = new Grid();

			const saved: ICell[] = grid.save();
			expect(saved[0].json).toEqual({
				rows :
				[
					{ columns: [{ symbol: '1' }] },
					{ columns: [{ symbol: '2' }] }
				]
			});
			expect(saved[1].json).toEqual({
				rows:
				[
					{ columns: [{ symbol: '1' }] },
					{ columns: [{ symbol: '2' }] }
				]
			});

			grid.fixByPosition(0, 0, 0, 0, 0, 0);
			const saved2: ICell[] = grid.save();
			expect(saved2[0].json).toEqual({ symbol: '1', setMethod: SetMethod.loaded });
			expect(saved2[1].json).toEqual({ symbol: '2' });

			expect(saved[0].json).toEqual({                             	// Ensure original save not changed
				rows:
				[
					{ columns: [{ symbol: '1' }] },
					{ columns: [{ symbol: '2' }] }
				]
			});
			expect(saved[1].json).toEqual({
				rows:
				[
					{ columns: [{ symbol: '1' }] },
					{ columns: [{ symbol: '2' }] }
				]
			});
		});
	});

	describe("4x1", () => {
		it("should be set", () => {
			const columns: number = 4;
			const rows: number = 1;
			Grid.Constructor(columns, rows);
			const grid: IGrid = new Grid();

			// Ensure a 1 x 4 grid created
			const expectedSubGrids: ISubGrid[][] = [];
			for (let row: number = 0; row < rows; row++) {
				expectedSubGrids[row] = [];
				for (let column: number = 0; column < columns; column++) {
					expectedSubGrids[row][column] = new SubGrid(column, row);
				}
			}
			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});
	});

	describe("1x4", () => {
		let grid: IGrid;
		let expectedSubGrids: ISubGrid[][];

		it("should be set", () => {
			const columns: number = 1;
			const rows: number = 4;
			Grid.Constructor(columns, rows);
			grid = new Grid();

			// Ensure a 4 x 1 grid created
			expectedSubGrids = [];
			for (let row: number = 0; row < rows; row++) {
				expectedSubGrids[row] = [];
				for (let column: number = 0; column < columns; column++) {
					expectedSubGrids[row][column] = new SubGrid(column, row);	// Columns and rows transposed
				}
			}
			expect(grid.compare(expectedSubGrids)).toBeTruthy();

			let row: number = rows;
			while (row--) {
				while (expectedSubGrids[row].length) {                  		// Clear sub grids
					expectedSubGrids[row].pop();
				}
			}

			// const expectedCells: ICell[][] = [];                  				// Columns & rows swopped i.e. 4x1
			// expectedCells[0] = [];
			// expectedCells[0][0] = new Cell(columns, rows, 0, 0);
			// expectedCells[0][1] = new Cell(columns, rows, 1, 0);
			// expectedCells[0][2] = new Cell(columns, rows, 2, 0);
			// expectedCells[0][3] = new Cell(columns, rows, 3, 0);

			expectedSubGrids[0][0] = new SubGrid(0, 0);
			expectedSubGrids[1][0] = new SubGrid(0, 1);
			expectedSubGrids[2][0] = new SubGrid(0, 2);
			expectedSubGrids[3][0] = new SubGrid(0, 3);
			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should be solved", () => {
			grid.setByOption(0, 0, 0, 0, 1, SetMethod.loaded); 						// Set top left cell to 1
			grid.setByOption(0, 1, 0, 0, 2, SetMethod.loaded);            // Set next top cell to 2
			grid.setByOption(0, 2, 0, 0, 4, SetMethod.loaded);            // Set 3rd cell to 3
			grid.solve();

			//  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             1       | [ 14 | 14 | 14 ]
			//  --------------|-----------------       --------------|-----------------
			//  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             2       | [ 13 | 13 | 13 ]
			//  --------------|-----------------  ->   --------------|-----------------
			//  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             4       | [ 11 | 11 | 11 ]
			//  --------------|-----------------       --------------|-----------------
			//  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]         |   |   | 8 | [  7 |  7 |  7 ]

			expectedSubGrids[0][0].setByOption(0, 0, 1, SetMethod.user);	// Top left cells set to 1, 2, 4 and 8
			expectedSubGrids[1][0].setByOption(0, 0, 2, SetMethod.user);
			expectedSubGrids[2][0].setByOption(0, 0, 4, SetMethod.user);
			expectedSubGrids[3][0].setByOption(0, 0, 8, SetMethod.user);
			expectedSubGrids[0][0].simplify();                            // Sets other cells to 14, 13, 11 and 7
			expectedSubGrids[1][0].simplify();
			expectedSubGrids[2][0].simplify();
			expectedSubGrids[3][0].simplify();                                                      
			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});
	});

	describe("2x2", () => {
		let grid: IGrid;
		let expectedSubGrids: ISubGrid[][];
		const columns: number = 2;
		const rows: number = 2;

		it("should be set", () => {
			Grid.Constructor(columns, rows);
			grid = new Grid();

			// Ensure a 2 x 2 grid created
			expectedSubGrids = [];
			for (let row: number = 0; row < rows; row++) {
				expectedSubGrids[row] = [];
				for (let column: number = 0; column < columns; column++) {
					expectedSubGrids[row][column] = new SubGrid(column, row);
				}
			}
			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should be simplified", () => {
			grid.fixByPosition(0, 0, 0, 0, 0, 0);                  				// Set top left cell to 1
			grid.fixByPosition(0, 0, 1, 0, 1, 0);                       	// Set top 2nd cell to 2
			grid.fixByPosition(1, 0, 0, 0, 0, 1);                       	// Set top 3rd cell to 3

			//        |       ||       |       |              |       ||       |       |
			//    1   |   2   ||   3   |   4   |          1   |   2   ||   4   |   8   |
			//        |       ||       |       |              |       ||       |       |
			//  --------------||----------------        --------------||----------------
			//    |   |   |   || 1 | 2 | 1 | 2 |              |       ||       |       |
			//  ----- | ----- || ----- | ----- |         12   |  12   ||   3   |   3   |
			//  3 | 4 | 3 | 4 ||   |   |   |   |              |       ||       |       |
			//  ================================    =   --------------||----------------
			//    | 2 | 1 |   || 1 | 2 | 1 | 2 |              |       ||       |       |
			//  ----- | ----- || ----- | ----- |         14   |  13   ||  11   |   7   |
			//  3 | 4 | 3 | 4 ||   | 4 | 3 |   |              |       ||       |       |
			//  --------------||----------------        --------------||----------------
			//    | 2 | 1 |   || 1 | 2 | 1 | 2 |              |       ||       |       |
			//  ----- | ----- || ----- | ----- |         14   |  13   ||  11   |   7   |
			//  3 | 4 | 3 | 4 ||   | 4 | 3 |   |              |       ||       |       |

			// Top left sub-grid
			expectedSubGrids[0][0].setByPosition(0, 0, 0, 0, SetMethod.user);	// Top left cell set to 1
			expectedSubGrids[0][0].setByPosition(1, 0, 1, 0, SetMethod.user); // Top right cell set to 2
			expectedSubGrids[0][0].simplify();
			// Top right sub-grid
			expectedSubGrids[0][1].setByPosition(0, 0, 0, 1, SetMethod.user); // Top left cell set to 4
			expectedSubGrids[0][1].setByPosition(1, 0, 1, 1, SetMethod.user); // Top right cell set to 8
			expectedSubGrids[0][1].simplify();
			// Bottom left sub-grid
			expectedSubGrids[1][0].removeOptionsFromColumn(0, 1);   			// option 1 removed from column 0
			expectedSubGrids[1][0].removeOptionsFromColumn(1, 2);
			// Bottom right sub-grid
			expectedSubGrids[1][1].removeOptionsFromColumn(0, 4);
			expectedSubGrids[1][1].removeOptionsFromColumn(1, 8);

			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should have bottom right sub-grid, top left cell set to 2", () => {
			grid.setByOption(1, 1, 0, 0, 2);															// Set bottom right sub-grid, top left cell to 2
			grid.simplify();

			//        |       ||       |       |              |       ||       |       |              |       ||       |       |
			//    1   |   2   ||   3   |   4   |          1   |   2   ||   3   |   4   |          1   |   2   ||   3   |   4   |
			//        |       ||       |       |              |       ||       |       |              |       ||       |       |
			//  --------------||----------------        --------------||----------------        --------------||----------------
			//    |   |   |   || 1 | 2 | 1 | 2 |          |   |   |   ||       |       |          |   |   |   ||       |       |
			//  ----- | ----- || ----- | ----- |        ----- | ----- ||   1   |   2   |        ----- | ----- ||   1   |   2   |
			//  3 | 4 | 3 | 4 ||   |   |   |   |        3 | 4 | 3 | 4 ||       |       |        3 | 4 | 3 | 4 ||       |       |
			//  ================================   ->   ================================   ->   ================================
			//    | 2 | 1 |   ||   -   | 1 | 2 |          |   | 1 |   ||       | 1 |   |          |   | 1 |   ||       | 1 |   |
			//  ----- | ----- ||  |2|  | ----- |        ----- | ----- ||   2   | ----- |        ----- | ----- ||   2   | ----- |
			//  3 | 4 | 3 | 4 ||   -   | 3 |   |        3 | 4 | 3 | 4 ||       | 3 |   |        3 | 4 | 3 | 4 ||       | 3 |   |
			//  --------------||----------------        --------------||----------------        --------------||----------------
			//    | 2 | 1 |   || 1 | 2 | 1 | 2 |          | 2 | 1 |   || 1 |   | 1 |   |              | 1 |   ||       | 1 |   |
			//  ----- | ----- || ----- | ----- |        ----- | ----- || ----- | ----- |          2   | ----- ||   4   | ----- |
			//  3 | 4 | 3 | 4 ||   | 4 | 3 |   |        3 |   | 3 |   ||   | 4 | 3 |   |              | 3 |   ||       | 3 |   |

			// Top right sub-grid
			expectedSubGrids[0][1].setByPosition(0, 1, 0, 0, SetMethod.user);	// Bottom left cell set to 1
			expectedSubGrids[0][1].setByPosition(1, 1, 1, 0, SetMethod.user); // Bottom right cell set to 2
			// Bottom left sub-grid
			expectedSubGrids[1][0].removeOptionsFromRow(0, 2);            // option 2 removed from row 0
			expectedSubGrids[1][0].removeOptionsFromRow(1, 8);
			expectedSubGrids[1][0].setByPosition(0, 1, 1, 0, SetMethod.user);
			// Bottom right sub-grid
			expectedSubGrids[1][1].setByPosition(0, 0, 1, 0, SetMethod.user);	// Top left cell set to 2
			expectedSubGrids[1][1].setByPosition(0, 1, 1, 1, SetMethod.user); // Bottom left cell set to 8
			expectedSubGrids[1][1].removeOptionsFromColumn(1, 2);         // Remove 2 from 2nd row

			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should have bottom left sub-grid, top right cell set to 3", () => {
			grid.setByOption(0, 1, 1, 0, 4); 															// Set bottom left sub-grid, top right cell to 4 (symbol 3)
			grid.simplify();

			//        |       ||       |       |              |       ||       |       |
			//    1   |   2   ||   3   |   4   |          1   |   2   ||   3   |   4   |
			//        |       ||       |       |              |       ||       |       |
			//  --------------||----------------        --------------||----------------
			//    |   |   |   ||       |       |              |       ||       |       |
			//  ----- | ----- ||   1   |   2   |          3   |   4   ||   1   |   2   |
			//  3 | 4 | 3 | 4 ||       |       |              |       ||       |       |
			//  ================================   ->   ================================
			//    |   |   -   ||       | 1 |   |              |       ||       |       |
			//  ----- |  |3|  ||   2   | ----- |          4   |   3   ||   2   |   1   |
			//  3 | 4 |   -   ||       | 3 |   |              |       ||       |       |
			//  --------------||----------------        --------------||----------------
			//        | 1 |   ||       | 1 |   |              |       ||       |       |
			//    2   | ----- ||   4   | ----- |          2   |   1   ||   4   |   3   |
			//        | 3 |   ||       | 3 |   |              |       ||       |       |

			// Top left sub-grid
			expectedSubGrids[0][0].setByPosition(0, 1, 0, 1, SetMethod.user);	// Bottom left cell set to 4
			expectedSubGrids[0][0].setByPosition(1, 1, 1, 1, SetMethod.user); // Bottom right cell set to 8
			// Bottom left sub-grid
			expectedSubGrids[1][0].setByPosition(0, 0, 1, 1, SetMethod.user);
			expectedSubGrids[1][0].setByPosition(1, 0, 0, 1, SetMethod.user);
			expectedSubGrids[1][0].setByPosition(1, 1, 0, 0, SetMethod.user);
			// Bottom right sub-grid
			expectedSubGrids[1][1].setByPosition(1, 0, 0, 0, SetMethod.user);
			expectedSubGrids[1][1].setByPosition(1, 1, 0, 1, SetMethod.user);

			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should be solved", () => {
			grid = new Grid();
			grid.setByOption(0, 0, 0, 0, 1);        											// 1 |   |   |
			grid.setByOption(0, 0, 1, 1, 2);              								//   | 2 |   |
			grid.setByOption(1, 1, 0, 0, 4);              								//   |   | 3 |
			grid.setByOption(1, 1, 1, 1, 8);              								//   |   |   | 4

			grid.setByOption(1, 0, 1, 0, 2);              								// top right set to 2
			grid.solve();

			expect(grid.solved()).toBeTruthy();
			expect(grid.toJson()).toEqual({
				//#region 2x2 JSON Grid - all cells set
				rows:
				[
					{
						columns:
						[
							{
								rows:
								[
									{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '3' }] },
									{ columns: [{ symbol: '4' }, { symbol: '2', setMethod: SetMethod.user }] }
								]
							},
							{
								rows:
								[
									{ columns: [{ symbol: '4' }, { symbol: '2', setMethod: SetMethod.user }] },
									{ columns: [{ symbol: '1' }, { symbol: '3' }] }
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
									{ columns: [{ symbol: '2' }, { symbol: '4' }] },
									{ columns: [{ symbol: '3' }, { symbol: '1' }] }
								]
							},
							{
								rows:
								[
									{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '1' }] },
									{ columns: [{ symbol: '2' }, { symbol: '4', setMethod: SetMethod.user }] }
								]
							}
						]
					}
				]
				//#endregion
			});
		});

		it("should have fixed cells", () => {
			grid = new Grid();
			grid.setByOption(0, 0, 0, 0, 1, SetMethod.loaded);         		// 1 |   |   |
			grid.setByOption(0, 0, 1, 1, 2, SetMethod.loaded);            //   | 2 |   |
			grid.setByOption(1, 1, 0, 0, 4, SetMethod.loaded);            //   |   | 3 |
			grid.setByOption(1, 1, 1, 1, 8, SetMethod.loaded);            //   |   |   | 4

			grid.setByOption(1, 0, 1, 0, 2, SetMethod.loaded);            // top right set to 2
			grid.solve();

			expect(grid.solved()).toBeTruthy();
			expect(grid.toJson()).toEqual({
				//#region 2x2 JSON Grid - cells fixed
				rows:
				[
					{
						columns:
						[
							{
								rows:
								[
									{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '3' }] },
									{ columns: [{ symbol: '4' }, { symbol: '2', setMethod: SetMethod.loaded }] }
								]
							},
							{
								rows:
								[
									{ columns: [{ symbol: '4' }, { symbol: '2', setMethod: SetMethod.loaded }] },
									{ columns: [{ symbol: '1' }, { symbol: '3' }] }
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
									{ columns: [{ symbol: '2' }, { symbol: '4' }] },
									{ columns: [{ symbol: '3' }, { symbol: '1' }] }
								]
							},
							{
								rows:
								[
									{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '1' }] },
									{ columns: [{ symbol: '2' }, { symbol: '4', setMethod: SetMethod.loaded }] }
								]
							}
						]
					}
				]
				//#endregion
			});
		});

		it("should load cells", () => {
			grid = new Grid();

			const saved: ICell[] = grid.save();

			grid.setByOption(0, 0, 0, 0, 1, SetMethod.loaded);
			grid.setByOption(0, 0, 1, 1, 2, SetMethod.loaded);
			grid.setByOption(1, 1, 0, 0, 4, SetMethod.loaded);
			grid.setByOption(1, 1, 1, 1, 8, SetMethod.loaded);
			
			grid.setByOption(1, 0, 1, 0, 2);
			expect(grid.solve()).toBeTruthy();
			const current: ICell[] = grid.save();

			for (let row: number = 0; row < rows; row++) {
				for (let column: number = 0; column < columns; column++) {
					expect(current[row * columns + column].json).not.toEqual(saved[row * columns + column].json);
				}
			}

			//grid.load(saved);
			//expect(grid.solve()).toBeFalsy();
			//current = grid.save();

			//for (const row: number = 0; row < rows; row++)
			//    for (const column: number = 0; column < columns; column++)
			//        expect(current[row * columns + column].json).toEqual(saved[row * columns + column].json);
		});

		it("should save cells", () => {
			const saved: ICell[] = grid.save();
			//grid.load(saved);

			for (let row: number = 0; row < rows; row++) {
				for (let column: number = 0; column < columns; column++) {
					expect(grid.save()[row * columns + column].json).toEqual(saved[row * columns + column].json);
				}
			}
		});

		xit("should eliminate cell", () => {
			grid = new Grid();
			grid.setByOption(0, 0, 0, 0, 1, SetMethod.loaded);           	// 1 |   |   |
			grid.setByOption(0, 0, 1, 1, 2, SetMethod.loaded);            //   | 2 |   |
			grid.setByOption(1, 1, 0, 0, 2, SetMethod.loaded);            //   |   | 2 |
			grid.setByOption(1, 1, 1, 1, 4, SetMethod.loaded);            //   |   |   | 3

			//    -   |   |   ||   |   |       |
			//   |1|  | ----- || ----- |   2   |
			//    -   | 3 | 4 || 3 | 4 |       |
			//  --------------||----------------
			//    |   |   -   || 1 |   | 1 |   |
			//  ----- |  |2|  || ----- | ----- |
			//  3 | 4 |   -   || 3 | 4 |   | 4 |
			//  ================================
			//    |   | 1 |   ||   -   | 1 |   |
			//  ----- | ----- ||  |2|  | ----- |
			//  3 | 4 | 3 | 4 ||   -   |   | 4 |
			//  --------------||----------------
			//        | 1 |   || 1 |   |   -   |
			//    2   | ----- || ----- |  |3|  |
			//        |   | 4 ||   | 4 |   -   |

			expect(false).toBeTruthy();

			// Check that solve() == above
			// Eliminate should remove (1, 0, 0, 1, "4") i.e. invalid option
		});
	});

	describe("4x2", () => {
		let grid: IGrid;
		let expectedSubGrids: ISubGrid[][];

		it("should be set", () => {
			const columns: number = 4;
			const rows: number = 2;
			Grid.Constructor(columns, rows);
			grid = new Grid();

			// Ensure a 4 x 2 grid created
			expectedSubGrids = [];
			for (let row: number = 0; row < rows; row++) {
				expectedSubGrids[row] = [];
				for (let column: number = 0; column < columns; column++) {
					expectedSubGrids[row][column] = new SubGrid(column, row);	// Columns and rows transposed
				}
			}
			expect(grid.compare(expectedSubGrids)).toBeTruthy();
		});

		it("should be solved", () => {
			grid.setByOption(0, 0, 1, 0, 128, SetMethod.loaded); 					//  1 |   | 3 |   |               || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 ||               |   | 2 |   | 4 
			grid.setByOption(0, 0, 0, 1, 64, SetMethod.loaded);  					// ---------------|       8       ||---------------|---------------|| --------------|---------------||       5       |---------------
			grid.setByOption(0, 0, 1, 2, 32, SetMethod.loaded);  					//    |   |   |   |               ||   | 6 | 7 |   |   | 6 | 7 |   ||   | 6 | 7 |   |   | 6 | 7 |   ||               |   |   |   |   
			grid.setByOption(0, 0, 0, 3, 16, SetMethod.loaded);  					// -------------------------------||-------------------------------|| ------------------------------||-------------------------------
																																		//                |   | 2 |   | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 |   | 3 |   |               
			grid.fixByPosition(0, 1, 0, 0, 3, 0);                       	//        7       | ------------- ||---------------|---------------|| --------------|---------------||---------------|       6       
			grid.fixByPosition(0, 1, 1, 1, 2, 0);                       	//                |   |   |   |   || 5 |   |   | 8 | 5 |   |   | 8 || 5 |   |   | 8 | 5 |   |   | 8 ||   |   |   |   |               
			grid.fixByPosition(0, 1, 0, 2, 1, 0);                       	// ---------------|---------------||---------------|---------------|| --------------|---------------||---------------|---------------
			grid.fixByPosition(0, 1, 1, 3, 0, 0);                       	//  1 |   | 3 |   |               || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 ||               |   | 2 |   | 4                                  
																																		// ---------------|       6       ||---------------|---------------|| --------------|---------------||       7       |---------------
			grid.fixByPosition(3, 0, 0, 0, 0, 1);                       	//    |   |   |   |               || 5 |   |   | 8 | 5 |   |   | 8 || 5 |   |   | 8 | 5 |   |   | 8 ||               |   |   |   |   
			grid.fixByPosition(3, 0, 1, 1, 1, 1);                       	// -------------------------------||-------------------------------|| ------------------------------||-------------------------------
			grid.fixByPosition(3, 0, 0, 2, 2, 1);                       	//                |   | 2 |   | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 || 1 |   | 3 |   |               
			grid.fixByPosition(3, 0, 1, 3, 3, 1);                       	//        5       | ------------- ||---------------|---------------|| --------------|---------------||---------------|       8       
																																		//                |   |   |   |   ||   | 6 | 7 |   |   | 6 | 7 |   ||   | 6 | 7 |   |   | 6 | 7 |   ||   |   |   |   |               
			grid.setByOption(3, 1, 1, 0, 1, SetMethod.loaded);   					// ==================================================================================================================================
			grid.setByOption(3, 1, 0, 1, 2, SetMethod.loaded);   					//                |   |   |   |   ||   | 2 | 3 |   |   | 2 | 3 |   ||   | 2 | 3 |   |   | 2 | 3 |   ||   |   |   |   |               
			grid.setByOption(3, 1, 1, 2, 4, SetMethod.loaded);   					//        4       |---------------||---------------|---------------|| --------------|---------------||---------------|       1       
			grid.setByOption(3, 1, 0, 3, 8, SetMethod.loaded);   					//                | 5 |   | 7 |   || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 ||   | 6 |   | 8 |               
																																		// -------------------------------||-------------------------------|| ------------------------------||-------------------------------
																																		//    |   |   |   |               || 1 |   |   | 4 | 1 |   |   | 4 || 1 |   |   | 4 | 1 |   |   | 4 ||               |   |   |   |   
																																		// ---------------|       3       ||---------------|---------------|| --------------|---------------||       2       |---------------
																																		//    | 6 |   | 8 |               || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 ||               | 5 |   | 7 |   
																																		// ---------------|---------------||---------------|---------------|| --------------|---------------||---------------|---------------
																																		//                |   |   |   |   || 1 |   |   | 4 | 1 |   |   | 4 || 1 |   |   | 4 | 1 |   |   | 4 ||   |   |   |   |               
																																		//        2       |---------------||---------------|---------------|| --------------|---------------||---------------|       3       
																																		//                | 5 |   | 7 |   || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 ||   | 6 |   | 8 |               
																																		// -------------------------------||-------------------------------|| ------------------------------||-------------------------------
																																		//    |   |   |   |               ||   | 2 | 3 |   |   | 2 | 3 |   ||   | 2 | 3 |   |   | 2 | 3 |   ||               |   |   |   |   
																																		// ---------------|       1       ||---------------|---------------|| --------------|---------------||       4       |---------------
																																		//    | 6 |   | 8 |               || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 || 5 | 6 | 7 | 8 | 5 | 6 | 7 | 8 ||               | 5 |   | 7 |   

			expectedSubGrids[0][0].get(0, 0).options = 1 + 4;
			expectedSubGrids[0][0].get(1, 0).options = 128;
			expectedSubGrids[0][0].get(0, 1).options = 64;
			expectedSubGrids[0][0].get(1, 1).options = 2 + 8;
			expectedSubGrids[0][0].get(0, 2).options = 1 + 4;
			expectedSubGrids[0][0].get(1, 2).options = 32;
			expectedSubGrids[0][0].get(0, 3).options = 16;
			expectedSubGrids[0][0].get(1, 3).options = 2 + 8;

			expectedSubGrids[0][1].get(0, 0).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][1].get(1, 0).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][1].get(0, 1).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][1].get(1, 1).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][1].get(0, 2).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][1].get(1, 2).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][1].get(0, 3).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][1].get(1, 3).options = 1 + 2 + 4 + 8 + 32 + 64;

			expectedSubGrids[0][2].get(0, 0).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][2].get(1, 0).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][2].get(0, 1).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][2].get(1, 1).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][2].get(0, 2).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][2].get(1, 2).options = 1 + 2 + 4 + 8 + 16 + 128;
			expectedSubGrids[0][2].get(0, 3).options = 1 + 2 + 4 + 8 + 32 + 64;
			expectedSubGrids[0][2].get(1, 3).options = 1 + 2 + 4 + 8 + 32 + 64;

			expectedSubGrids[0][3].get(0, 0).options = 16;
			expectedSubGrids[0][3].get(1, 0).options = 2 + 8;
			expectedSubGrids[0][3].get(0, 1).options = 1 + 4;
			expectedSubGrids[0][3].get(1, 1).options = 32;
			expectedSubGrids[0][3].get(0, 2).options = 64;
			expectedSubGrids[0][3].get(1, 2).options = 2 + 8;
			expectedSubGrids[0][3].get(0, 3).options = 1 + 4;
			expectedSubGrids[0][3].get(1, 3).options = 128;

			expectedSubGrids[1][0].get(0, 0).options = 8;
			expectedSubGrids[1][0].get(1, 0).options = 16 + 64;
			expectedSubGrids[1][0].get(0, 1).options = 32 + 128;
			expectedSubGrids[1][0].get(1, 1).options = 4;
			expectedSubGrids[1][0].get(0, 2).options = 2;
			expectedSubGrids[1][0].get(1, 2).options = 16 + 64;
			expectedSubGrids[1][0].get(0, 3).options = 32 + 128;
			expectedSubGrids[1][0].get(1, 3).options = 1;

			expectedSubGrids[1][1].get(0, 0).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(1, 0).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(0, 1).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(1, 1).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(0, 2).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(1, 2).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(0, 3).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][1].get(1, 3).options = 2 + 4 + 16 + 32 + 64 + 128;

			expectedSubGrids[1][2].get(0, 0).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(1, 0).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(0, 1).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(1, 1).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(0, 2).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(1, 2).options = 1 + 8 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(0, 3).options = 2 + 4 + 16 + 32 + 64 + 128;
			expectedSubGrids[1][2].get(1, 3).options = 2 + 4 + 16 + 32 + 64 + 128;

			expectedSubGrids[1][3].get(0, 0).options = 32 + 128;
			expectedSubGrids[1][3].get(1, 0).options = 1;
			expectedSubGrids[1][3].get(0, 1).options = 2;
			expectedSubGrids[1][3].get(1, 1).options = 16 + 64;
			expectedSubGrids[1][3].get(0, 2).options = 32 + 128;
			expectedSubGrids[1][3].get(1, 2).options = 4;
			expectedSubGrids[1][3].get(0, 3).options = 8;
			expectedSubGrids[1][3].get(1, 3).options = 16 + 64;

			expect(grid.compare(expectedSubGrids)).toBeTruthy();

			expect(grid.solve()).toBeFalsy();                            	// Should modify grid i.e. remove options
			expect(grid.simplify()).toBeFalsy();
			expect(grid.compare(expectedSubGrids)).toBeTruthy();

			const cells: ICell[][] = [];
			cells[0] = [];
			cells[1] = [];
			cells[2] = [];
			cells[3] = [];
			cells[0][0] = new Cell(0, 0);
			cells[0][1] = new Cell(1, 0);
			cells[1][0] = new Cell(0, 1);
			cells[1][1] = new Cell(1, 1);
			cells[2][0] = new Cell(0, 2);
			cells[2][1] = new Cell(1, 2);
			cells[3][0] = new Cell(0, 3);
			cells[3][1] = new Cell(1, 3);

			cells[0][0].options = 1 | 4;
			cells[0][1].options = 128;
			cells[1][0].options = 64;
			cells[1][1].options = 2 | 8;
			cells[2][0].options = 1 | 4;
			cells[2][1].options = 32;
			cells[3][0].options = 16;
			cells[3][1].options = 2 | 8;
			expect(grid.get(0, 0).compare(cells)).toBeTruthy();

			cells[0][0].options = 1 + 2 + 4 + 8 + 32 + 64;
			cells[0][1].options = 1 + 2 + 4 + 8 + 32 + 64;
			cells[1][0].options = 1 + 2 + 4 + 8 + 16 + 128;
			cells[1][1].options = 1 + 2 + 4 + 8 + 16 + 128;
			cells[2][0].options = 1 + 2 + 4 + 8 + 16 + 128;
			cells[2][1].options = 1 + 2 + 4 + 8 + 16 + 128;
			cells[3][0].options = 1 + 2 + 4 + 8 + 32 + 64;
			cells[3][1].options = 1 + 2 + 4 + 8 + 32 + 64;
			expect(grid.get(1, 0).compare(cells)).toBeTruthy();
			expect(grid.get(2, 0).compare(cells)).toBeTruthy();

			cells[0][0].options = 16;
			cells[0][1].options = 2 + 8;
			cells[1][0].options = 1 + 4;
			cells[1][1].options = 32;
			cells[2][0].options = 64;
			cells[2][1].options = 2 + 8;
			cells[3][0].options = 1 + 4;
			cells[3][1].options = 128;
			expect(grid.get(3, 0).compare(cells)).toBeTruthy();
		});
	});

	describe("Json", () => {
		describe("1x2", () => {
			const columns: number = 1;
			const rows: number = 2;
			let grid: IGrid;

			it("should be setup", () => {
				Grid.Constructor(columns, rows);
				grid = new Grid();

				expect(grid.toJson()).toEqual({
					//#region 1x2 JSON Grid
					rows:
					[
						{
							columns:
							[
								{
									rows:
									[
										{
											columns:
											[
												{
													rows:
													[
														{ columns: [{ symbol: '1' }] },
														{ columns: [{ symbol: '2' }] }
													]
												},
												{
													rows:
													[
														{ columns: [{ symbol: '1' }] },
														{ columns: [{ symbol: '2' }] }
													]
												}
											]
										}
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
										{
											columns:
											[
												{
													rows:
													[
														{ columns: [{ symbol: '1' }] },
														{ columns: [{ symbol: '2' }] }
													]
												},
												{
													rows:
													[
														{ columns: [{ symbol: '1' }] },
														{ columns: [{ symbol: '2' }] }
													]
												}
											]
										}
									]
								}
							]
						}
					]
					//#endregion
				});
			});

			it("should be solved", () => {
				grid.setByOption(0, 0, 0, 0, 1);
				expect(grid.toJson()).toEqual({
					rows:
					[
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '2' }] }
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
										{ columns: [{ symbol: '2' }, { symbol: '1' }] }
									]
								}
							]
						}
					]
				});
			});
		});

		describe("2x2", () => {
			const columns: number = 2;
			const rows: number = 2;
			let grid: IGrid;

			it("should be setup", () => {
					Grid.Constructor(columns, rows);
					grid = new Grid();

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
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
													},
													{
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
													}
											]
									},
									{
											columns:
											[
													{
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
													},
													{
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
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have top left cell set to 1", () => {
					grid.fixByPosition(0, 0, 0, 0, 0, 0);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{
																			columns:
																			[
																					{ symbol: '1', setMethod: SetMethod.loaded },
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					}
																			]
																	}
															]
													},
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
													}
											]
									},
									{
											columns:
											[
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
													},
													{
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
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have second top left cell set to 2", () => {
					grid.fixByPosition(0, 0, 1, 0, 1, 0);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{
																			columns:
																			[
																					{ symbol: '1', setMethod: SetMethod.loaded },
																					{ symbol: '2', setMethod: SetMethod.loaded }
																			]
																	},
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					}
																			]
																	}
															]
													},
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
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
													}
											]
									},
									{
											columns:
											[
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					}
																			]
																	}
															]
													},
													{
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
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have top left sub grid solved", () => {
					grid.setByOption(0, 0, 0, 1, 4);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '2', setMethod: SetMethod.loaded }] },
																	{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '4' }] }
															]
													},
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }] },
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
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4', strikeOut: true }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
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
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
															]
													},
													{
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
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have top grid row set", () => {
					grid.setByOption(1, 0, 0, 0, 4, SetMethod.loaded);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '2', setMethod: SetMethod.loaded }] },
																	{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '4' }] }
															]
													},
													{
															rows:
															[
																	{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '4' }] },
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4', strikeOut: true }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
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
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
															]
													},
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
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
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
															]
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have top right grid solved", () => {
					grid.setByOption(1, 0, 0, 1, 1);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '2', setMethod: SetMethod.loaded }] },
																	{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '4' }] }
															]
													},
													{
															rows:
															[
																	{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '4' }] },
																	{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '2' }] }
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
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
															]
													},
													{
															rows:
															[
																	{
																			columns:
																			[
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
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
																									{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																									{ columns: [{ symbol: '3', strikeOut: true }, { symbol: '4' }] }
																							]
																					},
																					{
																							rows:
																							[
																									{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
																									{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
																							]
																					}
																			]
																	}
															]
													}
											]
									}
							]
							//#endregion
					});
			});

			it("should have left grid row set", () => {
				grid.setByOption(0, 1, 0, 0, 2);

				expect(grid.toJson()).toEqual({
					//#region 2x2 JSON Grid
					rows:
					[
						{
							columns:
							[
								{
									rows:
									[
										{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '2', setMethod: SetMethod.loaded }] },
										{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '4' }] }
									]
								},
								{
									rows:
									[
										{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '4' }] },
										{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '2' }] }
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
										{
											columns:
											[
												{ symbol: '2', setMethod: SetMethod.user },
												{
													rows:
													[
														{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
														{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
													]
												}
											]
										},
										{
											columns:
											[
												{ symbol: '4' },
												{
													rows:
													[
														{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
														{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
													]
												}
											]
										}
									]
								},
								{
									rows:
									[
										{
											columns:
											[
												{ symbol: '4' },
												{
													rows:
													[
														{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
														{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
													]
												}
											]
										},
										{
											columns:
											[
												{ symbol: '2' },
												{
													rows:
													[
														{ columns: [{ symbol: '1' }, { symbol: '2', strikeOut: true }] },
														{ columns: [{ symbol: '3' }, { symbol: '4', strikeOut: true }] }
													]
												}
											]
										}
									]
								}
							]
						}
					]
					//#endregion
				});
			});

			it("should be solved", () => {
					grid.fixByPosition(0, 1, 1, 0, 0, 1);

					expect(grid.toJson()).toEqual({
							//#region 2x2 JSON Grid
							rows:
							[
									{
											columns:
											[
													{
															rows:
															[
																	{ columns: [{ symbol: '1', setMethod: SetMethod.loaded }, { symbol: '2', setMethod: SetMethod.loaded }] },
																	{ columns: [{ symbol: '3', setMethod: SetMethod.user }, { symbol: '4' }] }
															]
													},
													{
															rows:
															[
																	{ columns: [{ symbol: '3', setMethod: SetMethod.loaded }, { symbol: '4' }] },
																	{ columns: [{ symbol: '1', setMethod: SetMethod.user }, { symbol: '2' }] }
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
																	{ columns: [{ symbol: '2', setMethod: SetMethod.user }, { symbol: '3', setMethod: SetMethod.loaded }] },
																	{ columns: [{ symbol: '4' }, { symbol: '1' }] }
															]
													},
													{
															rows:
															[
																	{ columns: [{ symbol: '4' }, { symbol: '1' }] },
																	{ columns: [{ symbol: '2' }, { symbol: '3' }] }
															]
													}
											]
									}
							]
							//#endregion
					});
			});
		});
	});

	describe("Set", () => {
		const columns: number = 2;
		const rows: number = 2;
		let grid: IGrid;

		beforeEach(() => {
			Grid.Constructor(columns, rows);
			grid = new Grid();
		});

		it("should have 1 symbol set", () => {
				const json = {
						//#region 2x2 JSON Grid
						rows:
						[
								{
										columns:
										[
												{
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
												},
												{
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
												}
										]
								},
								{
										columns:
										[
												{
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
												},
												{
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
												}
										]
								}
						]
						//#endregion
				}

				grid.setJson(json);
				expect(grid.toJson()).toEqual(json);
		});

		xit("should have options struck out", () => {
			grid.setJson({
				//#region 2x2 JSON Grid - top left sub grid, top left cell set to 1
				rows:
				[
					{
							columns:
							[
									{
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
									},
									{
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
									}
							]
					},
					{
							columns:
							[
									{
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
									},
									{
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
									}
							]
					}
				]
				//#endregion    
			});

			expect(grid.toJson()).toEqual({
				//#region 2x2 JSON Grid - option 1 struck out from all top left sub grid cells and left column and top row
				rows:
				[
					{
							columns:
							[
									{
											rows:
											[
													{
															columns:
															[
																	{ symbol: '1' },
																	{
																			rows:
																			[
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																					{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																			]
																	},
																	{
																			rows:
																			[
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																					{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																			]
																	}
															]
													}
											]
									},
									{
											rows:
											[
													{
															columns:
															[
																	{
																			rows:
																			[
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
																					{ columns: [{ symbol: '3' }, { symbol: '4' }] }
																			]
																	},
																	{
																			rows:
																			[
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
									}
							]
					},
					{
							columns:
							[
									{
											rows:
											[
													{
															columns:
															[
																	{
																			rows:
																			[
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
																					{ columns: [{ symbol: '1', strikeOut: true }, { symbol: '2' }] },
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
									},
									{
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
									}
							]
					}
				]
				//#endregion
			});
		});

		it("should be solved", () => {
			const json = {
				//#region 2x2 JSON Grid - all cells set
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
													{ columns: [{ symbol: '3' }, { symbol: '4' }] },
													{ columns: [{ symbol: '1' }, { symbol: '2' }] }
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
													{ columns: [{ symbol: '2' }, { symbol: '3' }] },
													{ columns: [{ symbol: '4' }, { symbol: '1' }] }
											]
									},
									{
											rows:
											[
													{ columns: [{ symbol: '4' }, { symbol: '1' }] },
													{ columns: [{ symbol: '2' }, { symbol: '3' }] }
											]
									}
							]
					}
				]
				//#endregion
			}

			grid.setJson(json);
			expect(grid.toJson()).toEqual(json);
			expect(grid.solved()).toBeTruthy();
		});
	});

	describe("Valid", () => {
		let grid: IGrid;

		beforeEach(() => {
			const columns: number = 2;
			const rows: number = 2;
			Grid.Constructor(columns, rows);
			grid = new Grid();
		});

		it("should have unmodified valid", () => {
			expect(grid.isValid()).toBeTruthy();
		});

		it("should have modified valid", () => {
			grid.setByOption(0, 0, 0, 0, 1,);            									// 1 |   |   |
			grid.setByOption(0, 0, 1, 1, 2,);            									//   | 2 |   |
			grid.setByOption(1, 1, 0, 0, 4,);            									//   |   | 3 |
			grid.setByOption(1, 1, 1, 1, 8,);            									//   |   |   | 4

			expect(grid.isValid()).toBeTruthy();
		});

		it("should have solved valid", () => {
			grid.setByOption(0, 0, 0, 0, 1);
			grid.setByOption(0, 0, 1, 1, 2);
			grid.setByOption(1, 1, 0, 0, 4);
			grid.setByOption(1, 1, 1, 1, 8);

			grid.setByOption(1, 0, 1, 0, 2);															// top right set to 2
			grid.solve();

			expect(grid.solved()).toBeTruthy();
			expect(grid.isValid()).toBeTruthy();
		});

		it("should not be valid", () => {
			grid.setByOption(0, 0, 0, 0, 1);           										// Set top left and top right cells to 1
			grid.setByOption(1, 0, 1, 0, 1);
			expect(grid.isValid()).toBeFalsy();
		});
	});
});