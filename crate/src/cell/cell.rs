use std::fmt::{self, Display};
use crate::cell::{SetMethod, SYMBOLS, OptionsRemaining};
use crate::utils::bit_utils::{highest_bit_position, number_of_bits_set, power_of_2_bit_positions};

#[derive(Debug, Copy, Clone)]
pub struct Cell {
  max_cells: usize,
  max_columns: usize,

  pub column: usize,
  pub row: usize,
  pub options: u64,
  pub total_options_remaining: usize,

  pub set_method: SetMethod
}

impl Display for Cell {
  fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
    if formatter.alternate() {
      write!(formatter, "{:0>1$b}", self.options, (self.max_cells + 1) * self.max_columns - 1)
    } else {
      write!(formatter, "{:>3}", self.options)
    }
  }
}

impl Cell {
  pub fn new(max_columns: usize, max_rows: usize, column: usize, row: usize) -> Self {
    let max_cells = max_columns * max_rows;
    Cell {
      max_cells,
      max_columns,
      column,
      row,
      options: (1 << max_cells) - 1,                                // Set all bits
      total_options_remaining: max_cells,
      set_method: SetMethod::Unset
    }
  }

  pub fn reset(&mut self) {
    self.set_method = SetMethod::Unset;
    self.total_options_remaining = self.max_cells;
    self.options = (1 << self.max_cells) - 1; // Set all bits
  }

  pub fn equal(&self, cell: &Cell) -> bool {
    self.options == cell.options
  }

  pub fn solved(&self) -> bool {
    self.total_options_remaining == 1
  }

  pub fn symbol(&self) -> char {
    let index = highest_bit_position(self.options);
    let set_column = index % self.max_columns;
    let set_row = index / self.max_columns >> 0;

    SYMBOLS[set_row * self.max_columns + set_column]
  }

  pub fn remove_option_at_position(&mut self, column: usize, row: usize) -> bool {
    // Return if last option left after removing this option
    let mut last_option_found = false;
    let bit = 1 << self.max_columns * row + column;

    if self.options & bit > 0 {
      // Check if option to remove exists
      self.options &= !bit;
      self.total_options_remaining -= 1;
      if self.total_options_remaining == 1 {
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      }
    }

    last_option_found
  }

  pub fn remove_option(&mut self, option: u64) -> bool {
    // Return if last option left after removing this option
    let mut last_option_found = false;

    if self.options & option > 0 && self.total_options_remaining > 1 {
      // Check if option to remove exists and not last option
      self.options &= !option;
      self.total_options_remaining -= 1;
      if self.total_options_remaining == 1 {
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      }
    }

    last_option_found
  }

  pub fn remove_options(&mut self, remove: u64) -> bool {
    let mut last_option_found = false;

    let mut remove_options = self.options & remove;
    if remove_options > 0 && self.total_options_remaining > 1 && self.options & !remove > 0 {
      // Remove options iff cell contains other options
      self.options -= remove_options;
      self.total_options_remaining -= number_of_bits_set(remove_options);

      if self.total_options_remaining == 1 {
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      } else {
        while remove_options > 0 {
          let highest_bit_pos = highest_bit_position(remove_options);
          remove_options -= 1 << highest_bit_pos;
        }
      }
    }

    last_option_found
  }

  pub fn set_by_position(&mut self, column: usize, row: usize, set_method: SetMethod) {
    self.set_method = set_method;
    self.clear_all_except_at_position(column, row);
  }

  pub fn set_by_index(&mut self, index: usize, set_method: SetMethod) {
    self.set_method = set_method;
    self.clear_all_except_at_position(index % self.max_columns, index / self.max_columns >> 0);
  }

  pub fn set_by_option(&mut self, option: u64, set_method: SetMethod) {
    self.set_by_index(power_of_2_bit_positions(option), set_method);
  }

  pub fn set_by_symbol(&mut self, symbol: char, set_method: SetMethod) {
    self.set_by_index(find_symbol_index(symbol), set_method);
  }

  pub fn contains_option(&self, option: u64) -> bool {
    self.options & option > 0
  }

  pub fn contains_option_at_position(&self, column: usize, row: usize) -> bool {
    let bit = 1 << row * self.max_columns + column;
    (self.options & bit) > 0
  }

  pub fn contains_options(&self, check_options: u64) -> bool {
    self.options & check_options == check_options
  }

  pub fn contains_symbol(&self, symbol: char) -> bool {
    self.options & 1 << find_symbol_index(symbol) > 0
  }

  fn clear_all_except_at_position(&mut self, column: usize, row: usize) {
    self.options = 1 << self.max_columns * row + column;
    self.total_options_remaining = 1;
  }

  pub fn removed_options_per_row(&mut self, row: usize) -> Vec<usize> {
    let mut removed_options = Vec::with_capacity(self.max_columns);

    let mut bit = 1 << row * self.max_columns;
    for column in 0..self.max_columns {
      if self.options & bit == 0 {
        removed_options.push(column);
      }
      bit <<= 1;                                                    // bit = 1 << row * columns + column
    }

    removed_options
  }
}

fn find_symbol_index(symbol: char) -> usize {
  SYMBOLS.iter().position(|&x| x == symbol).unwrap()
}
