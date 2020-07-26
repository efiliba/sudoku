#[cfg(test)]
use crate::sub_grid::sub_grid::SubGrid;

#[cfg(test)]
fn init_sub_grids(columns: usize, rows: usize) -> Vec<Vec<SubGrid>> {
  let mut sub_grids: Vec<Vec<SubGrid>> = Vec::with_capacity(columns * rows);
  for row in 0..rows {
    sub_grids.push(Vec::with_capacity(columns));
    for column in 0..columns {
      sub_grids[row].push(SubGrid::new(rows, columns, row, column));  // Columns and rows transposed
    }
  }

  sub_grids
}

#[cfg(test)]
mod grid {
  use crate::cell::SetMethod;
  use crate::grid::grid::Grid;

  #[test]
  fn it_can_remove_an_option() {
    let columns = 2;                                                // [ 1 | 2 ] | [ 1 | 2 ]         2  |  1
    let rows = 1;                                                   // ----------|----------  ->   -----|-----
    let mut grid = Grid::new(columns, rows);                        // [ 1 | 2 ] | [ 1 | 2 ]         1  |  2

    let only_option_left = grid.remove_option(0, 0, 0, 0, 1);       // Remove option 1 from top left, leaving option 2 (only)
    assert!(only_option_left);

    let mut expected_sub_grids = super::init_sub_grids(columns, rows);
    expected_sub_grids[0][0].set_by_option(0, 0, 2, SetMethod::User);
    expected_sub_grids[0][0].set_by_option(0, 1, 1, SetMethod::User);
    expected_sub_grids[0][1].set_by_option(0, 0, 1, SetMethod::User);
    expected_sub_grids[0][1].set_by_option(0, 1, 2, SetMethod::User);

    assert!(grid.compare(&expected_sub_grids));
  }

  #[test]
  fn it_solves_a_2x1_grid() {
    let columns = 2;
    let rows = 1;
    let mut grid = Grid::new(columns, rows);
    assert_eq!(grid.solved(), false);                               // Not solved yet

    grid.set_by_option(0, 0, 0, 0, 1, SetMethod::Loaded);           // Set top left cell to 1

    assert!(grid.solved());
  }

  #[test]
  fn it_solves_a_3x1_grid() {
    let columns = 3;
    let rows = 1;
    let mut grid = Grid::new(columns, rows);

    grid.set_by_option(0, 0, 0, 0, 1, SetMethod::Loaded);           // Set top left cell to 1
    grid.set_by_option(1, 0, 0, 1, 2, SetMethod::Loaded);           // Middle cell to 2

    assert!(grid.solve());
  }

  #[test]
  fn it_creates_a_4x1_grid() {
    let columns = 4;
    let rows = 1;
    let grid = Grid::new(columns, rows);

    let expected_sub_grids = super::init_sub_grids(columns, rows);
    assert!(grid.compare(&expected_sub_grids));
  }

  #[test]
  fn it_simplifies_a_1x4_grid() {
    let columns = 1;
    let rows = 4;
    let mut grid = Grid::new(columns, rows);

    let mut expected_sub_grids = super::init_sub_grids(columns, rows);
    assert!(grid.compare(&expected_sub_grids));

    grid.set_by_option(0, 0, 0, 0, 1, SetMethod::Loaded);           // Set top left cell to 1
    grid.set_by_option(0, 1, 0, 0, 2, SetMethod::Loaded);           // Set next top cell to 2
    grid.set_by_option(0, 2, 0, 0, 4, SetMethod::Loaded);           // Set 3rd cell to 3
    
    //  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             1       | [ 14 | 14 | 14 ]
    //  --------------|-----------------       --------------|-----------------
    //  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             2       | [ 13 | 13 | 13 ]
    //  --------------|-----------------  ->   --------------|-----------------
    //  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]             4       | [ 11 | 11 | 11 ]
    //  --------------|-----------------       --------------|-----------------
    //  1 | 2 | 4 | 8 | [ 15 | 15 | 15 ]         |   |   | 8 | [  7 |  7 |  7 ]

    expected_sub_grids[0][0].set_by_option(0, 0, 1, SetMethod::User); // Top left cells set to 1, 2, 4 and 8
    expected_sub_grids[1][0].set_by_option(0, 0, 2, SetMethod::User);
    expected_sub_grids[2][0].set_by_option(0, 0, 4, SetMethod::User);
    expected_sub_grids[3][0].set_by_option(0, 0, 8, SetMethod::User);
    expected_sub_grids[0][0].simplify();                            // Sets other cells to 14, 13, 11 and 7
    expected_sub_grids[1][0].simplify();
    expected_sub_grids[2][0].simplify();
    expected_sub_grids[3][0].simplify();

    assert!(grid.compare(&expected_sub_grids));
  }

}

#[cfg(test)]
mod grid_2x2 {
  use crate::cell::SetMethod;
  use crate::grid::grid::Grid;

  #[test]
  fn it_simplifies_the_2x2_grid() {
    let columns = 2;
    let rows = 2;
    let mut grid = Grid::new(columns, rows);

    let mut expected_sub_grids = super::init_sub_grids(columns, rows);
    assert!(grid.compare(&expected_sub_grids));                     // Ensure the 2 x 2 grid is set

    grid.fix_by_position(0, 0, 0, 0, 0, 0);                         // Set top left cell to 1
    grid.fix_by_position(0, 0, 1, 0, 1, 0);                         // Set top 2nd cell to 2
    grid.fix_by_position(1, 0, 0, 0, 0, 1);                         // Set top 3rd cell to 3

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
    expected_sub_grids[0][0].set_by_position(0, 0, 0, 0, SetMethod::User);  // Top left cell set to 1
    expected_sub_grids[0][0].set_by_position(1, 0, 1, 0, SetMethod::User);  // Top right cell set to 2
    expected_sub_grids[0][0].simplify();
    // Top right sub-grid
    expected_sub_grids[0][1].set_by_position(0, 0, 0, 1, SetMethod::User);  // Top left cell set to 4
    expected_sub_grids[0][1].set_by_position(1, 0, 1, 1, SetMethod::User);  // Top right cell set to 8
    expected_sub_grids[0][1].simplify();
    // Bottom left sub-grid
    expected_sub_grids[1][0].remove_options_from_column(0, 1);      // option 1 removed from column 0
    expected_sub_grids[1][0].remove_options_from_column(1, 2);
    // Bottom right sub-grid
    expected_sub_grids[1][1].remove_options_from_column(0, 4);
    expected_sub_grids[1][1].remove_options_from_column(1, 8);

    assert!(grid.compare(&expected_sub_grids));
  }

  #[test]
  fn it_sets_bottom_right_sub_grids_top_left_cell_to_2() {
    let columns = 2;
    let rows = 2;
    let mut grid = Grid::new(columns, rows);

    let mut expected_sub_grids = super::init_sub_grids(columns, rows);

    grid.fix_by_position(0, 0, 0, 0, 0, 0);                         // Continue from previous test
    grid.fix_by_position(0, 0, 1, 0, 1, 0);
    grid.fix_by_position(1, 0, 0, 0, 0, 1);

    grid.set_by_option(1, 1, 0, 0, 2, SetMethod::User);             // Set bottom right sub-grid, top left cell to 2
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

    expected_sub_grids[0][0].set_by_position(0, 0, 0, 0, SetMethod::User);  // Continue from previous test
    expected_sub_grids[0][0].set_by_position(1, 0, 1, 0, SetMethod::User);
    expected_sub_grids[0][0].simplify();
    expected_sub_grids[0][1].set_by_position(0, 0, 0, 1, SetMethod::User);
    expected_sub_grids[0][1].set_by_position(1, 0, 1, 1, SetMethod::User);
    expected_sub_grids[0][1].simplify();
    expected_sub_grids[1][0].remove_options_from_column(0, 1);
    expected_sub_grids[1][0].remove_options_from_column(1, 2);
    expected_sub_grids[1][1].remove_options_from_column(0, 4);
    expected_sub_grids[1][1].remove_options_from_column(1, 8);

    // Top right sub-grid
    expected_sub_grids[0][1].set_by_position(0, 1, 0, 0, SetMethod::User);  // Bottom left cell set to 1
    expected_sub_grids[0][1].set_by_position(1, 1, 1, 0, SetMethod::User);  // Bottom right cell set to 2
    // Bottom left sub-grid
    expected_sub_grids[1][0].remove_options_from_row(0, 2);         // option 2 removed from row 0
    expected_sub_grids[1][0].remove_options_from_row(1, 8);
    expected_sub_grids[1][0].set_by_position(0, 1, 1, 0, SetMethod::User);
    // Bottom right sub-grid
    expected_sub_grids[1][1].set_by_position(0, 0, 1, 0, SetMethod::User);  // Top left cell set to 2
    expected_sub_grids[1][1].set_by_position(0, 1, 1, 1, SetMethod::User);  // Bottom left cell set to 8
    expected_sub_grids[1][1].remove_options_from_column(1, 2);      // Remove 2 from 2nd row

    assert!(grid.compare(&expected_sub_grids));
  }

  #[test]
  fn it_sets_bottom_left_sub_grids_top_right_cell_to_2() {
    let columns = 2;
    let rows = 2;
    let mut grid = Grid::new(columns, rows);

    let mut expected_sub_grids = super::init_sub_grids(columns, rows);

    grid.fix_by_position(0, 0, 0, 0, 0, 0);                         // Continue from previous test
    grid.fix_by_position(0, 0, 1, 0, 1, 0);
    grid.fix_by_position(1, 0, 0, 0, 0, 1);
    grid.set_by_option(1, 1, 0, 0, 2, SetMethod::User);

    grid.set_by_option(0, 1, 1, 0, 4, SetMethod::User);             // Set bottom left sub-grid, top right cell to 4 (symbol 3)

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

    expected_sub_grids[0][0].set_by_position(0, 0, 0, 0, SetMethod::User);  // Continue from previous test
    expected_sub_grids[0][0].set_by_position(1, 0, 1, 0, SetMethod::User);
    expected_sub_grids[0][0].simplify();
    expected_sub_grids[0][1].set_by_position(0, 0, 0, 1, SetMethod::User);
    expected_sub_grids[0][1].set_by_position(1, 0, 1, 1, SetMethod::User);
    expected_sub_grids[0][1].simplify();
    expected_sub_grids[1][0].remove_options_from_column(0, 1);
    expected_sub_grids[1][0].remove_options_from_column(1, 2);
    expected_sub_grids[1][1].remove_options_from_column(0, 4);
    expected_sub_grids[1][1].remove_options_from_column(1, 8);
    expected_sub_grids[0][1].set_by_position(0, 1, 0, 0, SetMethod::User);
    expected_sub_grids[0][1].set_by_position(1, 1, 1, 0, SetMethod::User);
    expected_sub_grids[1][0].remove_options_from_row(0, 2);
    expected_sub_grids[1][0].remove_options_from_row(1, 8);
    expected_sub_grids[1][0].set_by_position(0, 1, 1, 0, SetMethod::User);
    expected_sub_grids[1][1].set_by_position(0, 0, 1, 0, SetMethod::User);
    expected_sub_grids[1][1].set_by_position(0, 1, 1, 1, SetMethod::User);
    expected_sub_grids[1][1].remove_options_from_column(1, 2);

    // Top left sub-grid
    expected_sub_grids[0][0].set_by_position(0, 1, 0, 1, SetMethod::User);  // Bottom left cell set to 4
    expected_sub_grids[0][0].set_by_position(1, 1, 1, 1, SetMethod::User);  // Bottom right cell set to 8
    // Bottom left sub-grid
    expected_sub_grids[1][0].set_by_position(0, 0, 1, 1, SetMethod::User);
    expected_sub_grids[1][0].set_by_position(1, 0, 0, 1, SetMethod::User);
    expected_sub_grids[1][0].set_by_position(1, 1, 0, 0, SetMethod::User);
    // Bottom right sub-grid
    expected_sub_grids[1][1].set_by_position(1, 0, 0, 0, SetMethod::User);
    expected_sub_grids[1][1].set_by_position(1, 1, 0, 1, SetMethod::User);

    assert!(grid.compare(&expected_sub_grids));
  }

  #[test]
  fn it_solves_a_2x2_grid() {
    let columns = 2;
    let rows = 2;
    let mut grid = Grid::new(columns, rows);

    grid.set_by_option(0, 0, 0, 0, 1, SetMethod::User);             // 1 |   |   |
    grid.set_by_option(0, 0, 1, 1, 2, SetMethod::User);             //   | 2 |   |
    grid.set_by_option(1, 1, 0, 0, 4, SetMethod::User);             //   |   | 3 |
    grid.set_by_option(1, 1, 1, 1, 8, SetMethod::User);             //   |   |   | 4

    grid.set_by_option(1, 0, 1, 0, 2, SetMethod::User);             // top right set to 2
    assert!(grid.solve());
  }
}

#[cfg(test)]
mod grid_3x2 {
  use crate::cell::SetMethod;
  use crate::grid::grid::Grid;

  #[test]
  #[ignore]
  fn it_solves_a_2x3_grid() {

    // TODO
    
    let columns = 2;
    let rows = 3;
    let mut grid = Grid::new(columns, rows);

    grid.set_by_symbol(0, 0, 2, 1, '2', SetMethod::Loaded);
    grid.set_by_symbol(1, 0, 0, 0, '1', SetMethod::Loaded);
    grid.set_by_symbol(1, 0, 2, 1, '3', SetMethod::Loaded);
    grid.set_by_symbol(0, 1, 0, 0, '4', SetMethod::Loaded);
    grid.set_by_symbol(0, 1, 2, 1, '3', SetMethod::Loaded);
    grid.set_by_symbol(1, 1, 0, 0, '3', SetMethod::Loaded);
    grid.set_by_symbol(1, 1, 2, 1, '5', SetMethod::Loaded);
    grid.set_by_symbol(0, 2, 0, 0, '3', SetMethod::Loaded);
    grid.set_by_symbol(0, 2, 2, 1, '1', SetMethod::Loaded);
    grid.set_by_symbol(1, 2, 0, 0, '6', SetMethod::Loaded);

    // [48, 60, 56, 1, 58, 42]
    // [49, 57, 2, 24, 56, 4]
    // [8, 51, 48, 4, 35, 35]
    // [35, 35, 4, 10, 43, 16]
    // [4, 26, 24, 32, 27, 11]
    // [50, 58, 1, 26, 30, 10]

    grid.solve();

    // [48, 4, 56, 1, 58, 42]       <- 60 changed to 4: correct
    // [49, 57, 2, 24, 56, 4]
    // [8, 51, 48, 4, 35, 35]
    // [35, 35, 4, 10, 43, 16]
    // [4, 26, 24, 32, 27, 11]
    // [50, 58, 1, 26, 4, 10]       <- 30 changed to 4: correct

    print!("{:#}", grid);
    assert!(false);
  }
}
