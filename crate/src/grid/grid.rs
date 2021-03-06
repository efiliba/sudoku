use std::fmt::{self, Display};
use std::collections::HashSet;

use crate::utils::combinations::Combinations;
use crate::utils::bit_utils::{number_of_bits_set, bitwise_or, only_option, containing_bit_index};
use crate::cell::{cell::Cell, SetMethod};
use crate::sub_grid::{sub_grid::SubGrid, BitOption};
use crate::grid::CellOptions;
use crate::utils::array_utils;

#[derive(Debug, Clone)]
pub struct Grid {
  max_columns: usize,
  max_rows: usize,
  max_options: usize,
  combinations: Combinations,
  
  sub_grids: Vec<Vec<SubGrid>>                                      // use get(column, row) -> returns sub-grids[row][column]
}

impl Display for Grid {
  fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
    let options_rows = self.available_options_rows();
    let transposed_rows = array_utils::transpose_rows(self.max_columns, &options_rows);
    let mut output = String::new();
    
    for row in transposed_rows.iter() {
      fmt::write(&mut output, format_args!("{:?}\n", row)).expect("Error writing cell in grid");
    }

    write!(formatter, "{}", output)
  }
}

impl Grid {
  pub fn new(max_columns: usize, max_rows: usize) -> Self {
    let mut sub_grids: Vec<Vec<SubGrid>> = Vec::with_capacity(max_rows);

    for row in 0..max_rows {
      sub_grids.push(Vec::with_capacity(max_columns));
      for column in 0..max_columns {
        sub_grids[row].push(SubGrid::new(max_rows, max_columns, column, row));  // max columns and rows swopped
      }
    }
  
    let max_options = max_columns * max_rows;

    Self {
      max_columns,
      max_rows,
      max_options,
      combinations: Combinations::new(max_options),
      sub_grids
    }
  }

  pub fn reset(&mut self) {
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        self.sub_grids[row][column].reset();
      }
    }
  }

  pub fn get(&mut self, column: usize, row: usize) -> &SubGrid {
    // sub-grids called by [column, row] but accessed by [row][column] for efficiency
    &self.sub_grids[row][column]
  } 
  
  pub fn compare(&self, items: &Vec<Vec<SubGrid>>) -> bool {
    let mut equal = true;
    let mut row = self.max_rows;
    while equal && row > 0 {
      row -= 1;
      let mut column = self.max_columns;
      while equal && column > 0 {
        column -= 1;
        let matrix = items[row][column].get_cells_matrix();
        equal = self.sub_grids[row][column].compare_ref(&matrix);
      }
    }

    equal
  }

  pub fn available_options_rows(&self) -> Vec<Vec<u64>> {
    let mut options_rows = Vec::with_capacity(self.max_options);
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        options_rows.push(self.sub_grids[row][column].available_options_row());
      }
    }

    options_rows
  }

  pub fn solve(&mut self) -> bool {
    // Repeat while an only option found or an option removed
    let mut eliminated = true;
    while eliminated {
      while self.simplify() {
      }
		  eliminated = self.eliminate();                                // Restart simplify -> eliminate loop
    }

    self.solved()
  }

  pub fn solved(&self) -> bool {
    let mut solved = true;

    let mut row = self.max_rows;
    while solved && row > 0 {
      row -= 1;
      let mut column = self.max_columns;
      while solved && column > 0 {
        column -= 1;
        solved = self.sub_grids[row][column].solved();
      }
    }

    solved
  }
  
  pub fn simplify(&mut self) -> bool {
    let mut only_option_found = false;

    // Check/remove only options in columns/rows/sub-grids and mulitipe options limited to a certain number of
    //   related cells i.e. if 2 cells in a row can only contain 1 or 2 => remove from other cells in row
    while self.remove_only_options() || self.check_limited_options() {
      only_option_found = true;
    }

    only_option_found
  }

  pub fn remove_option(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ) -> bool {
    if self.sub_grids[sub_grid_row][sub_grid_column].cells[cell_row][cell_column].remove_option(option) {
      // Check if last option left
      self.strike_out(
        sub_grid_column,
        sub_grid_row,
        cell_column,
        cell_row,
        self.sub_grids[sub_grid_row][sub_grid_column].cells[cell_row][cell_column].options
      );

      return true;
    }

    false
  }

  pub fn load_set_options(&mut self, options: &Vec<u64>) {
    let grouped = array_utils::group_by_root(options);

    for sub_grid_row in 0..self.max_rows {
      for sub_grid_column in 0..self.max_columns {
        let sub_grid_options = &grouped[sub_grid_row * self.max_columns + sub_grid_column];
        for cell_row in 0..self.max_columns {                // dimensions columns & rows swopped
          for cell_column in 0..self.max_rows {
            let option = sub_grid_options[cell_row * self.max_rows + cell_column];
            if option > 0 {
              self.set_by_option(sub_grid_column, sub_grid_row, cell_column, cell_row, option, SetMethod::Loaded);
            }
          }
        }
      }
    }
  }

  fn is_valid(&self) -> bool {
    // Check columns and rows contain all options and no set cell duplicted
    self.matrix_valid(self.get_transposed_cells_matrix()) && self.matrix_valid(self.get_cells_matrix())
  }

  fn matrix_valid(&self, matrix: Vec<Vec<&Cell>>) -> bool {
    let mut valid = true;

    let mut index = self.max_options;
		while valid && index > 0 {
      index -= 1;

			let set_options = distinct_set_options(&matrix[index]);       // Get unique set cells
			let unset_options = unset_options(&matrix[index]);

      valid = set_options.len() + unset_options.len() == self.max_options &&  // Ensures set_options do not contain duplicates
        (bitwise_or(&set_options) | bitwise_or(&unset_options)) == (1 << self.max_options) - 1; // total set_options | unset_options must contain all the options
    }

		valid
  }
  
  fn eliminate(&mut self) -> bool {
    let mut valid = true;
    let mut total_unset_options = 2;
    while valid && total_unset_options <= self.max_options {
      let mut row_pos = self.max_rows;
      while valid && row_pos > 0 {
        let mut column_pos = self.max_columns;
        while valid && column_pos > 0 {
          let unset_cells = self.unset_cells(&mut column_pos, &mut row_pos, total_unset_options);

          let mut index = unset_cells.len();
          while valid && index > 0 {
            index -= 1;
            let cell = &unset_cells[index];
            
            valid = match self.find_invalid_option(column_pos - 1, row_pos - 1, cell.column, cell.row, cell.options) {
              Some(option) => {
                self.remove_option(column_pos - 1, row_pos - 1, cell.column, cell.row, option);
                false
              },
              None => true
            };
          }

          if column_pos > 0 {
            column_pos -= 1;
          }
        }

        if row_pos > 0 {
          row_pos -= 1;
        }
      }

      total_unset_options += 1;
    }

    !valid                                                          // Option removed?
  }

  fn unset_cells(&self, column_pos: &mut usize, row_pos: &mut usize, total_unset_options: usize) -> Vec<CellOptions> {
    let mut cells = Vec::new();
    let mut set = false;
    while !set && *row_pos > 0 {
      while !set && *column_pos > 0 {
        cells = self.sub_grids[*row_pos - 1][*column_pos - 1].unset_cells(total_unset_options)
          .iter()
          .map(|cell| CellOptions {column: cell.column, row: cell.row, options: cell.options})
          .collect();

        set = cells.len() > 0;
        if !set {
          *column_pos -= 1;
        }
      }

      if !set {
        *row_pos -= 1;
        if *row_pos > 0 {
          *column_pos = self.max_columns;
        }
      }
    }

    cells
  }

  fn find_invalid_option(
    &self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    options: u64
  ) -> Option<u64> {
    let mut copy = self.clone();

    let mut valid = true;
    let mut remaining_options = options;
    let mut try_option = remaining_options & !(remaining_options - 1);  // lowest set bit value

    while remaining_options > 0 && valid {
      copy.set_by_option(sub_grid_column, sub_grid_row, cell_column, cell_row, try_option, SetMethod::Calculated);
      copy.solve();
      valid = copy.is_valid();

      remaining_options -= try_option;                            // remove tried option
      if valid && remaining_options > 0 {
        try_option = remaining_options & !(remaining_options - 1);
      }
    }

    if !valid {                                                     // try_option resulted in an invalid state
      return Some(try_option);
    }

    None
  }

  pub fn strike_out(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ) {
    let mut struck_out_cells = self.sub_grids[sub_grid_row][sub_grid_column]
      .strike_out_cell(cell_column, cell_row, option);

    let mut index = struck_out_cells.removed_options_from_column.len(); // Distinct
    while index > 0 {
      index -= 1;
      let remove_option = &struck_out_cells.removed_options_from_column[index];
      struck_out_cells.last_options_found.append(
        &mut self.remove_option_from_other_columns(
          remove_option.sub_grid_column,
          remove_option.sub_grid_row,
          remove_option.cell_column,
          remove_option.bits
        )
      );
    }

    index = struck_out_cells.removed_options_from_row.len();
    while index > 0 { 
      index -= 1;
      let remove_option = &struck_out_cells.removed_options_from_row[index];
      struck_out_cells.last_options_found.append(
        &mut self.remove_option_from_other_rows(
          remove_option.sub_grid_column,
          remove_option.sub_grid_row,
          remove_option.cell_row,
          remove_option.bits
        )
      );
    }

    struck_out_cells.last_options_found.append(
      &mut self.remove_options_from_column(
        sub_grid_column,
        sub_grid_row,
        cell_column,
        option
      )
    );

    struck_out_cells.last_options_found.append(
      &mut self.remove_options_from_row(
        sub_grid_column,
        sub_grid_row,
        cell_row,
        option
      )
    );

    index = struck_out_cells.last_options_found.len();
    while index > 0 {
      index -= 1;
      let last_option = &struck_out_cells.last_options_found[index];
      self.strike_out(
        last_option.sub_grid_column,
        last_option.sub_grid_row,
        last_option.cell_column,
        last_option.cell_row,
        last_option.bits
      );
    }
  }

  pub fn fix_by_position(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ) {
    self.sub_grids[sub_grid_row][sub_grid_column].set_by_position(
      cell_column,
      cell_row,
      option_column,
      option_row,
      SetMethod::Loaded
    );

    let option = 1 << (self.max_columns * option_row + option_column);
    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
  }

  pub fn set_by_option(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64,
    set_method: SetMethod
  ) {
    self.sub_grids[sub_grid_row][sub_grid_column].set_by_option(cell_column, cell_row, option, set_method);
    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
  }

  fn _load_option(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ) {
    self.sub_grids[sub_grid_row][sub_grid_column].set_by_option(cell_column, cell_row, option, SetMethod::Calculated);
  }
  
  pub fn set_by_symbol(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    symbol: char,
    set_method: SetMethod
  ) {
    let option = self.sub_grids[sub_grid_row][sub_grid_column].set_by_symbol(
      cell_column,
      cell_row,
      symbol,
      set_method
    );
    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
  }
  
  pub fn set_by_index(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    index: usize,
    set_method: SetMethod
  ) {
    let option = self.sub_grids[sub_grid_row][sub_grid_column].set_by_index(
      cell_column,
      cell_row,
      index,
      set_method
    );
    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
  }

  pub fn to_options(&mut self) -> Vec<usize> {
    self.available_options_rows().iter()
      .flat_map(|x| x.iter().map(|&x| x  as usize)).collect()
  }

  // Check for mulitipe options limited to a certain number of related cells i.e. 2 cells in a row can only contain 1 or 2 => remove from other cells in row
  fn check_limited_options(&mut self) -> bool {
    let mut limited_options = self.find_options_limited_to_matrix(self.get_transposed_cells_matrix());  // Columns
    let mut limited_option_found = self.remove_if_extra_options_from_column(&limited_options);  // Remove options iff the cell contains other options

    if !limited_option_found {
      limited_options = self.find_options_limited_to_matrix(self.get_cells_matrix()); // Rows
      limited_option_found = self.remove_if_extra_options_from_row(&limited_options);
    }

    if !limited_option_found {
      limited_options = self.find_options_limited_to_sub_grids();
      limited_option_found = self.remove_if_extra_options_from_sub_grid(&limited_options);
    }

    limited_option_found
  }

  fn find_options_limited_to_matrix(&self, cells: Vec<Vec<&Cell>>) -> Vec<CellOptions> {
    let mut limited_options: Vec<CellOptions> = Vec::new();
    let mut unset_cells: Vec<&Cell> = Vec::new();
    let mut pick_options: Vec<&Cell> = Vec::new();
    let mut combination_options: Vec<u64> = Vec::new();

    for cell_index in 0..self.max_options {
      unset_cells.clear();

      // IEnumerable<Cell> unset_cells = cells[index].Where(x => !x.IsSet);  // Get cells that are still to be set
      let check_cells = &cells[cell_index];
      let mut index = check_cells.len();
      while index > 0 {
        index -= 1;
        if check_cells[index].set_method == SetMethod::Unset {
          unset_cells.push(&check_cells[index]);
        }
      }
      let total_unset_cells = unset_cells.len();

      // Find max remaining options, less than total_unset_cells
      // int max_remaining_options = unset_cells.Where(x => x.TotalOptionsRemaining < total_unset_cells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < total_unset_cells
      let mut max_remaining_options = 0;
      index = total_unset_cells;
      while index > 0 {
        index -= 1;
        let total_options_remaining = unset_cells[index].total_options_remaining;
        if total_options_remaining < total_unset_cells && total_options_remaining > max_remaining_options {
          max_remaining_options = total_options_remaining;
        }
      }

      let mut found = false;
      let mut pick = 1;
      while !found && pick < max_remaining_options {
        pick += 1;
        // Clear arrays
        combination_options.clear();
        pick_options.clear();

        // Get options with at least the number of bits to pick set
        // IEnumerable <Cell> options = unset_cells.Where(x => x.TotalOptionsRemaining <= pick); // Get options with at least the number of bits to pick set
        index = total_unset_cells;
        while index > 0 {
          index -= 1;
          if unset_cells[index].total_options_remaining <= pick {
            pick_options.push(&unset_cells[index]);
          }
        }

        let combinations = self.combinations.select(&pick_options, pick);
        index = combinations.len();
        while !found && index > 0 {
          index -= 1;
          // int remove_options = BitwiseOR(enumerator.Current.Select(x => x.Options));
          let mut combinations_index = combinations[index].len();
          while combinations_index > 0 {
            combinations_index -= 1;
            combination_options.push(combinations[index][combinations_index].options);
          }
          let remove_options = bitwise_or(&combination_options);

          found = number_of_bits_set(remove_options) <= pick;
          if found {
            limited_options.push(CellOptions {
              column: cell_index,
              row: cell_index,
              options: remove_options,
            });
          }
        }
      }
    }

    limited_options
  }

  fn find_options_limited_to_sub_grids(&self) -> Vec<CellOptions> {
    let mut limited_options = Vec::new();
    let mut pick_options: Vec<&Cell> = Vec::new();
    let mut combination_options = Vec::new();
    
    for row in 0..self.max_rows {
      for column in 0..self.max_columns {
        let unset_cells = self.sub_grids[row][column].get_unset_cells();
        let total_unset_cells = unset_cells.len();

        // int max_remaining_options = unset_cells.Where(x => x.TotalOptionsRemaining < total_unset_cells).Max(x => (int?) x.TotalOptionsRemaining) ?? 0;    // Max < total_unset_cells
        let mut max_remaining_options = 0;
        let mut index = total_unset_cells;
        while index > 0 {
          index -= 1;
          let total_options_remaining = unset_cells[index].total_options_remaining;
          if total_options_remaining < total_unset_cells && total_options_remaining > max_remaining_options {
            max_remaining_options = total_options_remaining;
          }
        }

        let mut found = false;
        let mut pick = 1;
        while !found && pick < max_remaining_options {
          pick += 1;
          // Clear arrays
          combination_options.clear();
          pick_options.clear();

          // Get options with at least the number of bits to pick set
          // IEnumerable <Cell> options = unset_cells.Where(x => x.TotalOptionsRemaining <= pick); // Get options with at least the number of bits to pick set
          index = total_unset_cells;
          while index > 0 {
            index -= 1;
            if unset_cells[index].total_options_remaining <= pick {
              // let t: &Cell = &unset_cells[index];
              // pick_options.push(t);      // ToDo:
            }
          }

          let combinations = self.combinations.select(&pick_options, pick);
          index = combinations.len();
          while !found && index > 0 {
            index -= 1;
            // int remove_options = BitwiseOR(enumerator.Current.Select(x => x.Options));
            let mut combinations_index = combinations[index].len();
            while combinations_index > 0 {
              combinations_index -= 1;
              combination_options.push(
                combinations[index][combinations_index].options
              );
            }
            let remove_options = bitwise_or(&combination_options);

            found = number_of_bits_set(remove_options) <= pick;
            if found {
              limited_options.push(CellOptions {
                column,
                row,
                options: remove_options,
              });
            }
          }
        }
      }
    }

    limited_options
  }

  fn remove_if_extra_options_from_column(&mut self, limited_options: &Vec<CellOptions>) -> bool {
    let mut last_options = Vec::new();

    let mut index = limited_options.len();
    while index > 0 {
      index -= 1;
      let limited_option = &limited_options[index];
      for row in 0..self.max_rows {
        last_options.append(&mut self.sub_grids[row][
            (limited_option.column / self.max_rows) >> 0
          ].remove_if_extra_options_from_column(
            limited_option.column % self.max_rows,
            limited_option.options
          )
        );
      }
    }

    index = last_options.len();
    while index > 0 {
      index -= 1;
      let last_option = &last_options[index];
      self.strike_out(
        last_option.sub_grid_column,
        last_option.sub_grid_row,
        last_option.cell_column,
        last_option.cell_row,
        last_option.bits
      );
    }

    last_options.len() > 0
  }

  fn remove_if_extra_options_from_row(&mut self, limited_options: &Vec<CellOptions>) -> bool {
    let mut last_options = Vec::new();

    let mut index = limited_options.len();
    while index > 0 {
      index -= 1;
      let limited_option = &limited_options[index];
      for column in 0..self.max_columns {
        last_options.append(
          &mut self.sub_grids[(limited_option.row / self.max_columns) >> 0][column]
            .remove_if_extra_options_from_row(
              limited_option.row % self.max_columns,
              limited_option.options
            )
        )
      }
    }

    index = last_options.len();
    while index > 0 {
      index -= 1;
      let last_option = &last_options[index];
      self.strike_out(
        last_option.sub_grid_column,
        last_option.sub_grid_row,
        last_option.cell_column,
        last_option.cell_row,
        last_option.bits
      );
    }

    last_options.len() > 0
  }

  fn remove_if_extra_options_from_sub_grid(&mut self, limited_options: &Vec<CellOptions>) -> bool {
    let mut last_options = Vec::new();

    let mut index = limited_options.len();
    while index > 0 {
      index -= 1;
      let limited_option = &limited_options[index];
      last_options.append(
        &mut self.sub_grids[limited_option.row][limited_option.column]
          .remove_if_extra_options(limited_option.options)
      )
    }

    index = last_options.len();
    while index > 0 {
      index -= 1;
      let last_option = &last_options[index];
      self.strike_out(
        last_option.sub_grid_column,
        last_option.sub_grid_row,
        last_option.cell_column,
        last_option.cell_row,
        last_option.bits
      );
    }

    last_options.len() > 0
  }

  fn remove_options_from_column(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    options: u64
  ) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    // Ignore sub_grid_row
    let mut row = self.max_rows - 1;
    while row > sub_grid_row {
      last_options.append(
        &mut self.sub_grids[row][sub_grid_column].remove_options_from_column(
          cell_column,
          options
        )
      );
      row -= 1;
    }
    while row > 0 {
      row -= 1;
      last_options.append(
        &mut self.sub_grids[row][sub_grid_column].remove_options_from_column(
          cell_column,
          options
        )
      );
    }

    last_options
  }

  fn remove_options_from_row(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_row: usize,
    options: u64
  ) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    // Ignore sub_grid_column
    let mut column = self.max_columns - 1;
    while column > sub_grid_column {
      last_options.append(&mut self.sub_grids[sub_grid_row][column].remove_options_from_row(cell_row, options));
      column -= 1;
    }

    while column > 0 {
      column -= 1;
      last_options.append(&mut self.sub_grids[sub_grid_row][column].remove_options_from_row(cell_row, options));
    }

    last_options
  }
  
  fn remove_only_options(&mut self) -> bool {
    self.remove_only_column_options() ||
    self.remove_only_row_options() ||
    self.remove_only_sub_grid_options()
  }

  fn remove_only_column_options(&mut self) -> bool {
    let mut only_option_found = false;

    let matrix = self.get_transposed_available_options_matrix();

    // Check for only options in each column
    let mut column = self.max_options;
    while !only_option_found && column > 0 {
      column -= 1;
      let (found, bit) = only_option(&matrix[column]);

      if found {
        only_option_found = true;
        let matrix_row = containing_bit_index(&matrix[column], bit);  // Row within grid where only option found
        self.set_by_option(
          (column / self.max_rows) >> 0,
          (matrix_row / self.max_columns) >> 0,
          column % self.max_rows,
          matrix_row % self.max_columns,
          bit,
          SetMethod::Calculated
        );
      }
    }

    only_option_found
  }

  fn remove_only_row_options(&mut self) -> bool {
    let mut only_option_found = false;

    let matrix = self.get_available_options_matrix();

    // Check for only options in each row
    let mut row = self.max_options;
    while !only_option_found && row > 0 {
      row -= 1;
      let (found, bit) = only_option(&matrix[row]);

      if found {
        only_option_found = true;
        let matrix_column = containing_bit_index(&matrix[row], bit);  // Column within grid where only option found
        self.set_by_option(
          (matrix_column / self.max_rows) >> 0,
          (row / self.max_columns) >> 0,
          matrix_column % self.max_rows,
          row % self.max_columns,
          bit,
          SetMethod::Calculated
        );
      }
    }

    only_option_found
  }

  fn remove_only_sub_grid_options(&mut self) -> bool {
    let mut only_option_found = false;

    // Check for only options in each sub grid
    let mut row = self.max_rows;
    while !only_option_found && row > 0 {
      row -= 1;

      let mut column = self.max_columns;
      while !only_option_found && column > 0 {
        column -= 1;
        let values = self.sub_grids[row][column].get_available_options();
        let (found, bit) = only_option(&values);

        if found {
          only_option_found = true;
          let array_index = containing_bit_index(&values, bit);     // Index within array where only option found
          self.set_by_option(
            column,
            row,
            array_index % self.max_rows,
            (array_index / self.max_rows) >> 0,
            bit,
            SetMethod::Calculated
          );
        }
      }
    }

    only_option_found
  }

  // Check options removed from other columns (n - 1) columns must have the options removed i.e. option must exist in only 1 column
  fn remove_option_from_other_columns(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    option: u64
  ) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    let mut total_existing_columns = 0;
    let mut total_existing_rows = 0;

    let mut existing_column = 0;
    let mut column = &self.max_rows - 1;                     // Use SubGrid's number of columns i.e. swopped rows
    while total_existing_columns < 2 && column > cell_column {
      if self.sub_grids[sub_grid_row][sub_grid_column].option_exists_in_column(column, option) {
        existing_column = column;
        total_existing_columns += 1;
      }
      column -= 1;
    }
    while total_existing_columns < 2 && column > 0 {
      column -= 1;
      if self.sub_grids[sub_grid_row][sub_grid_column].option_exists_in_column(column, option) {
        existing_column = column;
        total_existing_columns += 1;
      }
    }

    if total_existing_columns == 1 {
        last_options = self.remove_options_from_column(sub_grid_column, sub_grid_row, existing_column, option);
    } else {
      // Check other sub grids in same column
      let mut existing_row = 0;
      let mut row = &self.max_rows - 1;
      while total_existing_rows < 2 && row > sub_grid_row {
        if self.sub_grids[row][sub_grid_column].option_exists_in_column(cell_column, option) {
          existing_row = row;
          total_existing_rows += 1;
        }
        row -= 1;
      }
      while total_existing_rows < 2 && row > 0 {
        row -= 1;
        if self.sub_grids[row][sub_grid_column].option_exists_in_column(cell_column, option) {
          existing_row = row;
          total_existing_rows += 1;
        }
      }

      if total_existing_rows == 1 {
        last_options = self.sub_grids[existing_row][sub_grid_column].remove_options_except_from_column(cell_column, option);
      }
    }

    last_options
  }

  // Check options removed from other rows (n - 1) rows must have the options removed i.e. option must exist in only 1 row
  fn remove_option_from_other_rows(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_row: usize,
    option: u64
  ) -> Vec<BitOption> {
    let mut last_options = Vec::new();

    let mut total_existing_columns = 0;
    let mut total_existing_rows = 0;

    let mut existing_row = 0;
    let mut row = self.max_columns - 1;                      // Use SubGrid's number of rows i.e. swopped columns
    while total_existing_rows < 2 && row > cell_row {
      if self.sub_grids[sub_grid_row][sub_grid_column].option_exists_in_row(row, option) {
        existing_row = row;
        total_existing_rows += 1;
      }
      row -= 1;
    }
    while total_existing_rows < 2 && row > 0 {
      row -= 1;
      if self.sub_grids[sub_grid_row][sub_grid_column].option_exists_in_row(row, option) {
        existing_row = row;
        total_existing_rows += 1;
      }
    }

    if total_existing_rows == 1 {
        last_options = self.remove_options_from_row(sub_grid_column, sub_grid_row, existing_row, option);
    } else {
      // Check other sub grids in same row
      let mut existing_column = 0;
      let mut column = self.max_columns - 1;
      while total_existing_columns < 2 && column > sub_grid_column {
        if self.sub_grids[sub_grid_row][column].option_exists_in_row(cell_row, option) {
          existing_column = column;
          total_existing_columns += 1;
        }
        column -= 1;
      }
      while total_existing_columns < 2 && column > 0 {
        column -= 1;
        if self.sub_grids[sub_grid_row][column].option_exists_in_row(cell_row, option) {
          existing_column = column;
          total_existing_columns += 1;
        }
      }

      if total_existing_columns == 1 {
        last_options = self.sub_grids[sub_grid_row][existing_column].remove_options_except_from_row(cell_row, option);
      }
    }

    last_options
  }

  ////////////////////////////////////////////////////////////////////////////////////////////
  // Convert sub grids to coluns * rows matrix
  ////////////////////////////////////////////////////////////////////////////////////////////

  fn get_available_options_matrix(&self) -> Vec<Vec<u64>> {
    // Get state of current grid - returned as an n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.max_options);
    for _ in 0..self.max_options {
      matrix.push(Vec::new());
    }
    
    for sub_grid_row in 0..self.max_rows {
      for sub_grid_column in 0..self.max_columns {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_available_options_matrix();

        for column in 0..self.max_columns {
          matrix[sub_grid_row * self.max_columns + column].extend(&sub_matrix[column]);
        }
      }
    }

    matrix
  }

  fn get_transposed_available_options_matrix(&self) -> Vec<Vec<u64>> {
    // Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.max_options);
    for _ in 0..self.max_options {
      matrix.push(Vec::new());
    }

    for sub_grid_column in 0..self.max_columns {
      for sub_grid_row in 0..self.max_rows {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_available_options_matrix();

        for cell_row in 0..self.max_columns {
          for cell_column in 0..self.max_rows {
            let matrix_column = sub_grid_column * self.max_rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }

  fn get_cells_matrix(&self) -> Vec<Vec<&Cell>> {
    // Get cells in current grid - returned as an n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.max_options);
    for _ in 0..self.max_options {
      matrix.push(Vec::new());
    }
    
    for sub_grid_row in 0..self.max_rows {
      for sub_grid_column in 0..self.max_columns {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_cells_matrix();

        for cell_column in 0..self.max_rows {
          for cell_row in 0..self.max_columns {
            let matrix_column = sub_grid_column * self.max_rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }

  fn get_transposed_cells_matrix(&self) -> Vec<Vec<&Cell>> {
    // Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.max_options);
    for _ in 0..self.max_options {
      matrix.push(Vec::new());
    }

    for sub_grid_column in 0..self.max_columns {
      for sub_grid_row in 0..self.max_rows {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_cells_matrix();

        for cell_row in 0..self.max_columns {
          for cell_column in 0..self.max_rows {
            let matrix_column = sub_grid_column * self.max_rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }
}

fn distinct_set_options(cells: &Vec<&Cell>) -> Vec<u64> {
  cells.iter().fold(HashSet::new(), |mut distinct_cells, cell| {
    if cell.set_method != SetMethod::Unset {
      distinct_cells.insert(cell.options);
    }
    distinct_cells
  }).into_iter().collect()
}

fn unset_options(cells: &Vec<&Cell>) -> Vec<u64> {
  // cells.Where(x => !x.IsSet).Select(x => x.Options)
  let mut options = Vec::with_capacity(cells.len());
  for index in 0..cells.len() {
    if cells[index].set_method == SetMethod::Unset {
      options.push(cells[index].options);
    }
  }

  options
}
