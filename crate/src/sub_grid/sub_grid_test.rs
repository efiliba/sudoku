#[cfg(test)]
use crate::cell::cell::Cell;

#[cfg(test)]
fn init_cells(columns: usize, rows: usize) -> Vec<Vec<Cell>> {
  let mut cells: Vec<Vec<Cell>> = Vec::with_capacity(columns * rows);
  for row in 0..rows {
    cells.push(Vec::with_capacity(columns));
    for column in 0..columns {
      cells[row].push(Cell::new(rows, columns, column, row));       // max columns and rows swopped
    }
  }

  cells
}

#[cfg(test)]
mod sub_grid {
  use crate::cell::SetMethod;
  use crate::sub_grid::sub_grid::SubGrid;

  #[test]
  fn it_creates_a_2x4_sub_grid() {
    let columns = 2;
    let rows = 4;
    let sub_grid = SubGrid::new(columns, rows, 0, 0);

    // Ensure a 2 x 4 sub grid created
    let expected_cells = super::init_cells(columns, rows);
    assert!(sub_grid.compare(&expected_cells));
  }

  #[test]
  fn it_creates_a_4x2_sub_grid() {
    let columns = 4;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 1, 3);           // Bottom right Cell of parent grid          

    let expected_cells = super::init_cells(columns, rows);
    assert!(sub_grid.compare(&expected_cells));

    assert_eq!(sub_grid.get(0, 0).options, 255);
    assert_eq!(sub_grid.get(1, 0).options, 255);
    assert_eq!(sub_grid.get(2, 0).options, 255);
    assert_eq!(sub_grid.get(3, 0).options, 255);
    assert_eq!(sub_grid.get(0, 1).options, 255);
    assert_eq!(sub_grid.get(1, 1).options, 255);
    assert_eq!(sub_grid.get(2, 1).options, 255);
    assert_eq!(sub_grid.get(3, 1).options, 255);
  }

  #[test]
  fn it_solves_the_4x2_sub_grid() {
    let columns = 4;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 1, 3);

    sub_grid.set_by_position(0, 0, 0, 0, SetMethod::User);
    sub_grid.set_by_option(1, 0, 2, SetMethod::User);
    sub_grid.set_by_position(2, 0, 2, 0, SetMethod::Loaded);
    sub_grid.set_by_option(3, 0, 4, SetMethod::Loaded);
    sub_grid.set_by_option(0, 1, 8, SetMethod::Loaded);
    sub_grid.set_by_position(1, 1, 1, 1, SetMethod::Loaded);
    sub_grid.set_by_option(2, 1, 32, SetMethod::User);
    sub_grid.set_by_position(3, 1, 3, 1, SetMethod::User);

    assert!(sub_grid.solved());
  }
}

#[cfg(test)]
mod strikes_out_options_in_3x2_sub_grid {
  use crate::cell::SetMethod;
  use crate::sub_grid::sub_grid::SubGrid;

  #[test]
  fn it_strikes_out_1_from_all_cells_except_top_left() {
    // 111111 111110 111110 === 63 62 62
    // 111110 111110 111110     62 62 62
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    // Remove 1 from all cells except top left cell - check 1 removed from other cells
    let remove_bit = 1;
    let test_column = 0;
    let test_row = 0;
  
    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    assert_eq!(struck_out_cells.last_options_found.len(), 0);       // No last options found
  
    let remove_from_column = struck_out_cells.removed_options_from_column;  // Removed 1 from columns 2 and 1
    assert_eq!(remove_from_column.len(), 2);
    assert_eq!(remove_from_column[0].cell_column, 2);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    assert_eq!(remove_from_column[1].cell_column, 1);
    assert_eq!(remove_from_column[1].bits, remove_bit);

    let remove_from_row = struck_out_cells.removed_options_from_row;  // Removed 1 from row 1
    assert_eq!(remove_from_row.len(), 1);
    assert_eq!(remove_from_row[0].cell_row, 1);
    assert_eq!(remove_from_column[0].bits, remove_bit);

    let mut expected_cells = super::init_cells(columns, rows);
    for row in 0..rows {
      for column in 0..columns {
        expected_cells[row][column].remove_option(remove_bit);
      }
    }
    expected_cells[test_row][test_column].reset();                  // No options removed
  
    assert!(sub_grid.compare(&expected_cells));
  }
    
  #[test]
  fn it_also_strikes_out_2_from_all_cells_except_top_middle() {
    // 111101 111110 111100 === 61 62 60
    // 111100 111100 111100     60 60 60
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    sub_grid.strike_out_cell(0, 0, 1);                              // Continue from previous test

    // Remove 2 from all cells except top left cell - check 2 removed from other cells
    let remove_bit = 2;
    let test_column = 1;
    let test_row = 0;
    
    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    assert_eq!(struck_out_cells.last_options_found.len(), 0);       // No last options found
    
    let remove_from_column = struck_out_cells.removed_options_from_column;  // Removed 2 from columns 2 and 0
    assert_eq!(remove_from_column.len(), 2);
    assert_eq!(remove_from_column[0].cell_column, 2);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    assert_eq!(remove_from_column[1].cell_column, 0);
    assert_eq!(remove_from_column[1].bits, remove_bit);

    let remove_from_row = struck_out_cells.removed_options_from_row;  // Removed 2 from row 1
    assert_eq!(remove_from_row.len(), 1);
    assert_eq!(remove_from_row[0].cell_row, 1);
    assert_eq!(remove_from_column[0].bits, remove_bit);

    let mut expected_cells = super::init_cells(columns, rows);
    for row in 0..rows {
      for column in 0..columns {
        expected_cells[row][column].remove_option(1);               // Continue from previous test
        expected_cells[row][column].remove_option(remove_bit);
      }
    }
    expected_cells[0][0].options |= 1;                              // Re-add the bit removed in setting up from previous test

    expected_cells[test_row][test_column].reset();                  // No options removed
    expected_cells[test_row][test_column].remove_option(1);          // Remove previous bit

    assert!(sub_grid.compare(&expected_cells));
  }

  #[test]
  fn it_also_strikes_out_4_from_all_cells_except_top_right() {
    // 111001 111010 111100 === 57 58 60
    // 111000 111000 111000     56 56 56
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    sub_grid.strike_out_cell(0, 0, 1);                              // Continue from previous tests
    sub_grid.strike_out_cell(1, 0, 2);

    // Remove 4 from top right cell
    let remove_bit = 4;
    let test_column = 2;
    let test_row = 0;
    
    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    assert_eq!(struck_out_cells.last_options_found.len(), 0);       // No last options found
    
    let remove_from_column = struck_out_cells.removed_options_from_column;  // Removed 4 from columns 1 and 0
    assert_eq!(remove_from_column.len(), 2);
    assert_eq!(remove_from_column[0].cell_column, 1);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    assert_eq!(remove_from_column[1].cell_column, 0);
    assert_eq!(remove_from_column[1].bits, remove_bit);

    let remove_from_row = struck_out_cells.removed_options_from_row;  // Removed 4 from row 1
    assert_eq!(remove_from_row.len(), 1);
    assert_eq!(remove_from_row[0].cell_row, 1);
    assert_eq!(remove_from_column[0].bits, remove_bit);

    let mut expected_cells = super::init_cells(columns, rows);      
    for row in 0..rows {
      for column in 0..columns {
        expected_cells[row][column].remove_option(1);               // Continue from previous test
        expected_cells[row][column].remove_option(2);
      
        expected_cells[row][column].remove_option(remove_bit);
      }
    }
    expected_cells[0][0].options |= 1;                              // Re-add the bit removed in setting up from previous test
    expected_cells[0][1].options |= 2;

    expected_cells[test_row][test_column].reset();
    expected_cells[test_row][test_column].remove_option(1 + 2);     // Remove previous bit

    assert!(sub_grid.compare(&expected_cells));
  }

  #[test]
  fn it_also_strikes_out_8_from_all_cells_except_bottom_left() {
    // 110001 110010 110100 === 49 50 52
    // 111000 110000 110000     56 48 48
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    sub_grid.strike_out_cell(0, 0, 1);                              // Continue from previous tests
    sub_grid.strike_out_cell(1, 0, 2);
    sub_grid.strike_out_cell(2, 0, 4);

    // Remove 8 from bottom left cell
    let remove_bit = 8;
    let test_column = 0;
    let test_row = 1;
    
    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    assert_eq!(struck_out_cells.last_options_found.len(), 0);       // No last options found
    
    let remove_from_column = struck_out_cells.removed_options_from_column;  // Removed 8 from columns 2 and 1
    assert_eq!(remove_from_column.len(), 2);
    assert_eq!(remove_from_column[0].cell_column, 2);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    assert_eq!(remove_from_column[1].cell_column, 1);
    assert_eq!(remove_from_column[1].bits, remove_bit);
    
    let remove_from_row = struck_out_cells.removed_options_from_row;  // Removed 8 from row 0
    assert_eq!(remove_from_row.len(), 1);
    assert_eq!(remove_from_row[0].cell_row, 0);
    assert_eq!(remove_from_column[0].bits, remove_bit);

    let mut expected_cells = super::init_cells(columns, rows);
    for row in 0..rows {
      for column in 0..columns {
        expected_cells[row][column].remove_option(1);               // Continue from previous test
        expected_cells[row][column].remove_option(2);
        expected_cells[row][column].remove_option(4);
      
        expected_cells[row][column].remove_option(remove_bit);
      }
    }
    expected_cells[0][0].options |= 1;                              // Re-add the bit removed in setting up from previous test
    expected_cells[0][1].options |= 2;
    expected_cells[0][2].options |= 4;

    expected_cells[test_row][test_column].reset();
    expected_cells[test_row][test_column].remove_option(1 + 2 + 4); // Remove previous bit

    assert!(sub_grid.compare(&expected_cells));
  }

  #[test]
  fn it_also_strikes_out_16_from_all_cells_except_bottom_middle() {
    // 100001 100010 100100 === 33 34 36 === (1,6) | (2,6) | (3,6)
    // 101000 110000 100000     40 48 32     (4,6) | (5,6) |  (6)
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    sub_grid.strike_out_cell(0, 0, 1);                              // Continue from previous tests
    sub_grid.strike_out_cell(1, 0, 2);
    sub_grid.strike_out_cell(2, 0, 4);
    sub_grid.strike_out_cell(0, 1, 8);

    // Remove 8 from bottom middle cell
    let remove_bit = 16;
    let test_column = 1;
    let test_row = 1;
    
    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    let last_options = struck_out_cells.last_options_found;
    assert_eq!(last_options.len(), 1);                              // A last option was found
    assert_eq!(last_options[0].cell_column, 2);                     // (2, 1) must be 6
    assert_eq!(last_options[0].cell_row, 1);
    assert_eq!(last_options[0].bits, 32);
    
    let remove_from_column = struck_out_cells.removed_options_from_column;  // Removed 16 from columns 2 and 0
    assert_eq!(remove_from_column.len(), 2);
    assert_eq!(remove_from_column[0].cell_column, 2);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    assert_eq!(remove_from_column[1].cell_column, 0);
    assert_eq!(remove_from_column[1].bits, remove_bit);
    
    let remove_from_row = struck_out_cells.removed_options_from_row;  // Removed 16 from row 0
    assert_eq!(remove_from_row.len(), 1);
    assert_eq!(remove_from_row[0].cell_row, 0);
    assert_eq!(remove_from_column[0].bits, remove_bit);
    
    let mut expected_cells = super::init_cells(columns, rows);
    for row in 0..rows {
      for column in 0..columns {
        expected_cells[row][column].remove_option(1);               // Continue from previous test
        expected_cells[row][column].remove_option(2);
        expected_cells[row][column].remove_option(4);
        expected_cells[row][column].remove_option(8);
      
        expected_cells[row][column].remove_option(remove_bit);
      }
    }
    expected_cells[0][0].options |= 1;                              // Re-add the bit removed in setting up from previous test
    expected_cells[0][1].options |= 2;
    expected_cells[0][2].options |= 4;
    expected_cells[1][0].options |= 8;

    expected_cells[test_row][test_column].reset();
    expected_cells[test_row][test_column].remove_option(1 + 2 + 4 + 8); // Remove previous bit

    assert!(sub_grid.compare(&expected_cells));
  }

  #[test]
  fn it_also_strikes_out_32_from_all_cells_except_bottom_right_and_solves() {
    // 000001 000010 000100 === 1  2  4
    // 001000 010000 100000     8 16 32
    let columns = 3;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    sub_grid.strike_out_cell(0, 0, 1);                              // Continue from previous tests
    sub_grid.strike_out_cell(1, 0, 2);
    sub_grid.strike_out_cell(2, 0, 4);
    sub_grid.strike_out_cell(0, 1, 8);
    sub_grid.strike_out_cell(1, 1, 16);

    // Set cells to those in last options found - i.e. 6 = 32 in bottom right cell
    let remove_bit = 32;
    let test_column = 2;
    let test_row = 1;

    assert_eq!(sub_grid.solved(), false);                           // Not solved yet
    assert_eq!(sub_grid.get(2, 1).set_method, SetMethod::Calculated); // But bottom right cell has been set

    let struck_out_cells = sub_grid.strike_out_cell(test_column, test_row, remove_bit);
    let last_options = struck_out_cells.last_options_found;
    assert_eq!(last_options.len(), 5);                              // Numerous last options were found
    assert_eq!(last_options[0].cell_column, 1);                     // (1, 1) must be 6
    assert_eq!(last_options[0].cell_row, 1);
    assert_eq!(last_options[0].bits, 16);
    assert_eq!(last_options[1].cell_column, 0);                     // (0, 1) must be 4
    assert_eq!(last_options[1].cell_row, 1);
    assert_eq!(last_options[1].bits, 8);
    assert_eq!(last_options[2].cell_column, 2);                     // (2, 0) must be 3
    assert_eq!(last_options[2].cell_row, 0);
    assert_eq!(last_options[2].bits, 4);
    assert_eq!(last_options[3].cell_column, 1);                     // (1, 0) must be 2
    assert_eq!(last_options[3].cell_row, 0);
    assert_eq!(last_options[3].bits, 2);
    assert_eq!(last_options[4].cell_column, 0);                     // (0, 0) must be 1
    assert_eq!(last_options[4].cell_row, 0);
    assert_eq!(last_options[4].bits, 1);

    assert_eq!(struck_out_cells.removed_options_from_column.len(), 0);  // No options to remove from column nor row
    assert_eq!(struck_out_cells.removed_options_from_row.len(), 0);

    //   expect(subGrid.toJson()).toEqual({
    //     rows:
    //     [
    //       { columns: [{ symbol: '1' }, { symbol: '2' }, { symbol: '3' }] },
    //       { columns: [{ symbol: '4' }, { symbol: '5' }, { symbol: '6' }] }
    //     ]
    //   });

    assert!(sub_grid.solved());                                     // Sub grid solved

    // Re-check - cells set by their position 
    let mut expected_cells = super::init_cells(columns, rows);
    expected_cells[0][0].set_by_position(0, 0, SetMethod::User);    // Cells transposed to sub-grid i.e. n x m -> m x n
    expected_cells[0][1].set_by_position(1, 0, SetMethod::User);
    expected_cells[0][2].set_by_position(0, 1, SetMethod::User);
    expected_cells[1][0].set_by_position(1, 1, SetMethod::User);
    expected_cells[1][1].set_by_position(0, 2, SetMethod::User);
    expected_cells[1][2].set_by_position(1, 2, SetMethod::User);
    
    assert!(sub_grid.compare(&expected_cells));
  }
}

#[cfg(test)]
mod sub_grid_2x2 {
  use crate::cell::SetMethod;
  use crate::sub_grid::sub_grid::SubGrid;

  #[test]
  fn it_solves_the_sub_grid() {
    let columns = 2;
    let rows = 2;
    let mut sub_grid = SubGrid::new(columns, rows, 0, 0);

    // Ensure a 2 x 2 sub grid created
    let expected_cells = super::init_cells(columns, rows);
    assert!(sub_grid.compare(&expected_cells));
    
    sub_grid.set_by_position(0, 0, 0, 0, SetMethod::User);          // Top left cell set to 1
    sub_grid.set_by_position(1, 0, 1, 0, SetMethod::User);          // Top right cell set to 2
    sub_grid.set_by_position(0, 1, 0, 1, SetMethod::User);          // Bottom left cell set to 4
    assert_eq!(sub_grid.get(1, 1).options, 15);                     // Nothing removed from bottom right cell
    assert_eq!(sub_grid.solved(), false);
    
    sub_grid.simplify();
    assert_eq!(sub_grid.get(1, 1).options, 8);                      // Only option 8 (symbol 4) left 
    assert!(sub_grid.solved());
  }
}
