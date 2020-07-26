use std::fmt::{self, Display};
use crate::cell::{cell::Cell, SetMethod, OptionsRemaining};
use crate::sub_grid::{BitOption, StruckOutCell, StruckOutCells};

#[derive(Debug, Clone)]
pub struct SubGrid {
  max_columns: usize,
  max_rows: usize,

  pub column: usize,
  pub row: usize,
  pub cells: Vec<Vec<Cell>>                                         // use get(column, row) -> returns cells[row][column]
}

impl Display for SubGrid {
  fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
    fn add_separator_line(output: &mut String, max_columns: usize, max_rows: usize) {
      // All left aligned padding '-' to ''
      fmt::write(output, format_args!("{:-<1$}", "", (max_columns * max_rows + 1) * max_columns - 1))
        .expect("Error adding separator line in sub-grid");
    }

    fn add_new_line(output: &mut String) {
      fmt::write(output, format_args!("\n")).expect("Error adding new line in sub-grid");
    }

    let mut output = String::new();

    if formatter.alternate() {
      add_separator_line(&mut output, self.max_columns, self.max_rows);
      add_new_line(&mut output);
    }

    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        if formatter.alternate() {
          fmt::write(&mut output, format_args!("{:#} ", self.cells[row][column]))
            .expect("Error writing cell in sub-grid");
        } else {
          fmt::write(&mut output, format_args!("{} ", self.cells[row][column]))
            .expect("Error writing cell in sub-grid");
        }
      }
    }

    if formatter.alternate() {
      add_separator_line(&mut output, self.max_columns, self.max_rows);
    } else {
      output.pop();                                                 // Remove last new line
    }

    writeln!(formatter, "{}", output)
  }
}

impl SubGrid {
  pub fn new(max_columns: usize, max_rows: usize, column: usize, row: usize) -> Self {
    let mut cells: Vec<Vec<Cell>> = Vec::with_capacity(max_rows);

    for row in 0..max_rows {
      cells.push(Vec::with_capacity(max_columns));
      for column in 0..max_columns {
        cells[row].push(Cell::new(max_rows, max_columns, column, row)); // max columns and rows swopped
      }
    }
  
    SubGrid {
      max_columns,
      max_rows,
      column,
      row,
      cells
    }
  }

  pub fn reset(&mut self) {
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        self.cells[row][column].reset();
      }
    }
  }

  pub fn get(&mut self, column: usize, row: usize) -> &mut Cell {
    // grids called by [column, row] but accessed by [row][column] for efficiency
    &mut self.cells[row][column]
  }

  pub fn available_options_row(&self) -> Vec<u64> {
    let mut options_row = Vec::with_capacity(self.max_columns * self.max_rows);

    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        options_row.push(self.cells[row][column].options);
      }
    }

    options_row
  }

  pub fn get_options_remaining(&self) -> Vec<OptionsRemaining> {
    let mut options_row = Vec::with_capacity(self.max_columns * self.max_rows);

    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        options_row.push(self.cells[row][column].get_options_remaining());
      }
    }

    options_row
  }

  pub fn set_options_remaining(&mut self, options: &Vec<OptionsRemaining>) {
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        self.cells[row][column].set_options_remaining(&options[row * self.max_columns + column]);
      }
    }
  }

  pub fn set_by_position(
    &mut self,
    column: usize,
    row: usize,
    option_column: usize,
    option_row: usize,
    set_method: SetMethod
  ) -> bool {
    let cell = &mut self.cells[row][column];
    if cell.set_method == SetMethod::Unset {
      // cell unset i.e. == SetMethod.unset
      cell.set_by_position(option_column, option_row, set_method);
      return true;
    }
    false
  }

  pub fn set_by_option(
    &mut self,
    column: usize,
    row: usize,
    option: u64,
    set_method: SetMethod
  ) -> bool {
    let cell = &mut self.cells[row][column];
    if cell.set_method == SetMethod::Unset {
      cell.set_by_option(option, set_method);
      return true;
    }
    false
  }

  pub fn set_by_symbol(
    &mut self,
    column: usize,
    row: usize,
    symbol: char,
    set_method: SetMethod
  ) -> u64 {
    let cell = &mut self.cells[row][column];
    if cell.set_method == SetMethod::Unset {
      cell.set_by_symbol(symbol, set_method);
      return cell.options;
    }
    0
  }

  pub fn set_by_index(
    &mut self,
    column: usize,
    row: usize,
    index: usize,
    set_method: SetMethod
  ) -> u64 {
    let cell = &mut self.cells[row][column];
    if cell.set_method == SetMethod::Unset {
      cell.set_by_index(index, set_method);
      return cell.options;
    }
    0
  }

  pub fn compare(&self, items: &Vec<Vec<Cell>>) -> bool {
    let mut equal = true;
    let mut row = self.max_rows;
    while equal && row > 0 {
      row -= 1;
      let mut column = self.max_columns;
      while equal && column > 0 {
        column -= 1;
        equal = self.cells[row][column].equal(&items[row][column]);
      }
    }

    equal
  }

  pub fn compare_ref(&self, items: &Vec<Vec<&Cell>>) -> bool {
    let mut equal = true;
    let mut row = self.max_rows;
    while equal && row > 0 {
      row -= 1;
      let mut column = self.max_columns;
      while equal && column > 0 {
        column -= 1;
        equal = self.cells[row][column].equal(&items[row][column]);
      }
    }

    equal
  }

  pub fn simplify(&mut self) {
    let mut changed = true;
    while changed {
      changed = false;

      let mut row = self.max_rows;
      while !changed && row > 0 {
        row -= 1;
        let mut column = self.max_columns;
        while !changed && column > 0 {
          column -= 1;
          changed =
            self.cells[row][column].set_method != SetMethod::Unset && // cell set
            self.remove_if_extra_options(self.cells[row][column].options).len() > 0;
        }
      }
    }
  }

  pub fn solved(&self) -> bool {
    let mut solved = true;

    let mut row = self.max_rows;
    while solved && row > 0 {
      row -= 1;
      let mut column = self.max_columns;
      while solved && column > 0 {
        column -= 1;
        solved = self.cells[row][column].solved();
      }
    }

    solved
  }

  pub fn get_available_options_matrix(&self) -> Vec<Vec<u64>> {
    let mut matrix = Vec::with_capacity(self.max_rows - 1);

    for row in 0..self.max_rows {
      let mut matrix_row = Vec::with_capacity(self.max_columns - 1);
      for column in 0..self.max_columns {
        matrix_row.push(self.cells[row][column].options);
      }
      matrix.push(matrix_row);
    }

    matrix
  }

  pub fn get_cells_matrix(&self) -> Vec<Vec<&Cell>> {
    let mut matrix: Vec<Vec<&Cell>> = Vec::with_capacity(self.max_rows);

    for row in 0..self.max_rows {
      matrix.push(Vec::with_capacity(self.max_columns));

      for column in 0..self.max_columns {
        matrix[row].push(&self.cells[row][column]);
      }
    }

    matrix
  }

  pub fn get_unset_cells(&self) -> Vec<Cell> {
    let mut unset_cells = Vec::new();

    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        if self.cells[row][column].set_method == SetMethod::Unset {
          unset_cells.push(self.cells[row][column]);                // Set copy of cell
        }
      }
    }

    unset_cells
  }

  pub fn unset_cells(&self, total_unset_options: usize) -> Vec<Cell> {
    let cells = self.get_unset_cells();
    let mut unset = Vec::new();

    for index in 0..cells.len() {
      if cells[index].total_options_remaining == total_unset_options {
        unset.push(cells[index]);
      }
    }

    unset
  }

  pub fn unset_cells_options(&self, total_unset_options: usize) -> Vec<u64> {
    let cells = self.get_unset_cells();
    let mut unset_options = Vec::new();

    for index in 0..cells.len() {
      if cells[index].total_options_remaining == total_unset_options {
        unset_options.push(cells[index].options);
      }
    }

    unset_options
  }

  pub fn get_available_options(&self) -> Vec<u64> {
    let mut array = Vec::with_capacity(self.max_columns * self.max_rows);
    
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        array.push(self.cells[row][column].options);
      }
    }

    array
  }

  // Remove option from all other cells in this sub grid - return array of last options found and options removed from all columns / rows in the sub grid
  pub fn strike_out_cell(
    &mut self,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ) -> StruckOutCells {
    let mut struck_out_cells = StruckOutCells::new();

    let mut column;
    let mut row = self.max_rows - 1;
    while row > cell_row {
      column = self.max_columns;
      while column > 0 {
        column -= 1;
        struck_out_cells.add(self.get_struck_out_cell(column, row, option));
      }
      row -= 1;
    }

    let mut column = self.max_columns - 1;
    while column > cell_column {
      struck_out_cells.add(self.get_struck_out_cell(column, row, option));
      column -= 1;
    }

    while column > 0 {
      column -= 1;
      struck_out_cells.add(self.get_struck_out_cell(column, row, option));
    }

    while row > 0 {
      row -= 1;
      column = self.max_columns;
      while column > 0 {
        column -= 1;
        struck_out_cells.add(self.get_struck_out_cell(column, row, option));
      }
    }

    struck_out_cells
  }

  fn get_struck_out_cell(&mut self, column: usize, row: usize, option: u64) -> StruckOutCell {
    let mut last_option_found: Option<BitOption> = None;
		let mut remove_option_from_column: Option<BitOption> = None;
    let mut remove_option_from_row: Option<BitOption> = None;
    
    if self.cells[row][column].remove_option(option) {
      last_option_found = Some(BitOption {
        sub_grid_column: self.column,
        sub_grid_row: self.row,
        cell_column: column,
        cell_row: row,
        bits: self.cells[row][column].options
      });
    } else {
      if self.option_removed_from_column(column, row, option) {
        remove_option_from_column = Some(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: column,
          cell_row: 0, // ToDo: -1,
          bits: option
        });
      }
      if self.option_removed_from_row(column, row, option) {
        remove_option_from_row = Some(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: 0, // ToDo: -1,
          cell_row: row,
          bits: option
        });
      }
    }

    StruckOutCell {
      last_option_found,
      remove_option_from_column,
      remove_option_from_row
    }
  }

  pub fn is_struck_out(
    &self,
    cell_column: usize,
    cell_row: usize,
    symbol: char
  ) -> bool {
    !self.cells[cell_row][cell_column].contains_symbol(symbol)
  }

  pub fn remove_options_from_column(&mut self, cell_column: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    for row in 0..self.max_rows {
      if self.cells[row][cell_column].remove_options(options) {
        last_options.push(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: cell_column,
          cell_row: row,
          bits: self.cells[row][cell_column].options,
        });
      }
    }

    last_options
  }

  pub fn remove_options_from_row(&mut self, cell_row: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    for column in 0..self.max_columns {
      if self.cells[cell_row][column].remove_options(options) {
        last_options.push(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: column,
          cell_row: cell_row,
          bits: self.cells[cell_row][column].options,
        });
      }
    }

    last_options
  }

  pub fn remove_options_except_from_column(&mut self, exclude_column: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    let mut row: usize;
    let mut column = self.max_columns - 1;
    while column > exclude_column {
      row = self.max_rows;
      while row > 0 {
        row -= 1;
        if self.cells[row][column].remove_options(options) {
          last_options.push(BitOption {
            sub_grid_column: self.column,
            sub_grid_row: self.row,
            cell_column: column,
            cell_row: row,
            bits: self.cells[row][column].options,
          });
        }
      }
      column -= 1;
    }

    while column > 0 {
      column -= 1;
      row = self.max_rows;
      while row > 0 {
        row -= 1;
        if self.cells[row][column].remove_options(options) {
          last_options.push(BitOption {
            sub_grid_column: self.column,
            sub_grid_row: self.row,
            cell_column: column,
            cell_row: row,
            bits: self.cells[row][column].options,
          });
        }
      }
    }

    last_options
  }

  pub fn remove_options_except_from_row(&mut self, exclude_row: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    let mut column: usize;
    let mut row = self.max_rows - 1;
    while row > exclude_row {
      column = self.max_columns;
      while column > 0 {
        column -= 1;
        if self.cells[row][column].remove_options(options) {
          last_options.push(BitOption {
            sub_grid_column: self.column,
            sub_grid_row: self.row,
            cell_column: column,
            cell_row: row,
            bits: self.cells[row][column].options,
          });
        }
      }
      row -= 1;
    }

    while row > 0 {
      row -= 1;
      column = self.max_columns;
      while column > 0 {
        column -= 1;
        if self.cells[row][column].remove_options(options) {
          last_options.push(BitOption {
            sub_grid_column: self.column,
            sub_grid_row: self.row,
            cell_column: column,
            cell_row: row,
            bits: self.cells[row][column].options,
          });
        }
      }
    }

    last_options
  }

  pub fn remove_if_extra_options_from_column(&mut self, column: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    for row in 0..self.max_rows {
      if self.cells[row][column].remove_options(options) {
        last_options.push(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: column,
          cell_row: row,
          bits: self.cells[row][column].options,
        });
      }
    }

    last_options
  }

  pub fn remove_if_extra_options_from_row(&mut self, row: usize, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    for column in 0..self.max_columns {
      if self.cells[row][column].remove_options(options) {
        last_options.push(BitOption {
          sub_grid_column: self.column,
          sub_grid_row: self.row,
          cell_column: column,
          cell_row: row,
          bits: self.cells[row][column].options,
        });
      }
    }

    last_options
  }

  pub fn remove_if_extra_options(&mut self, options: u64) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        if self.cells[row][column].remove_options(options) {
          last_options.push(BitOption {
            sub_grid_column: self.column,
            sub_grid_row: self.row,
            cell_column: column,
            cell_row: row,
            bits: self.cells[row][column].options,
          });
        }
      }
    }

    last_options
  }

  pub fn option_exists_in_column(&self, column: usize, option: u64) -> bool {
    let mut found = false;
    let mut row = self.max_rows;
    while !found && row > 0 {
      row -= 1;
      found = self.cells[row][column].contains_option(option);
    }

    found
  }

  pub fn option_exists_in_row(&self, row: usize, option: u64) -> bool {
    let mut found = false;
    let mut column = self.max_columns;
    while !found && column > 0 {
      column -= 1;
      found = self.cells[row][column].contains_option(option);
    }

    found
  }

  pub fn option_removed_from_column(&self, cell_column: usize, cell_row: usize, option: u64) -> bool {
    // Check if option removed from column
    let mut option_found = false;
    let mut row = self.max_rows;
    while !option_found && row > cell_row + 1 {
      row -= 1;
      option_found = (self.cells[row][cell_column].options & option) > 0;
    }

    row -= 1;                                                       // Skip row_column
    while !option_found && row > 0 {
      row -= 1;
      option_found = (self.cells[row][cell_column].options & option) > 0;
    }
  
    !option_found                                                   // If option not found then it was removed from self sub grid's column
  }

  pub fn option_removed_from_row(&self, cell_column: usize, cell_row: usize, removed_option: u64) -> bool {
    // Check if option removed from row
    let mut option_found = false;
    let mut column = self.max_columns;
    while !option_found && column > cell_column + 1 {
      column -= 1;
      option_found = (self.cells[cell_row][column].options & removed_option) > 0;
    }
    
    column -= 1;                                                    // Skip cell_column
    while !option_found && column > 0 {
      column -= 1;
      option_found = (self.cells[cell_row][column].options & removed_option) > 0;
    }

    !option_found                                                   // If option not found then it was removed from self sub grid's row
  }

  pub fn set_cells(&self, _sub_grid: Vec<Vec<Cell>>) {
    for _row in 0..self.max_rows {
      for _column in 0..self.max_columns {
        // self.cells[row][column] = Cell::new(sub_grid[row][column]); -> set using copy letructor ?
      }
    }
  }

  pub fn load(&mut self, symbol_positions: &Vec<u64>) {
    let mut symbol_pos_iter = symbol_positions.iter();
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        match symbol_pos_iter.next() {
          None => {},
          Some(0) => {},
          Some(symbol_pos) => {
            self.cells[row][column].set_by_index((*symbol_pos - 1) as usize, SetMethod::Loaded);
          }
        }
      }
    }
  }
}
