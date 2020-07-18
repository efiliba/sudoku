use std::fmt::{self, Display};
use crate::cell::{dimensions::Dimensions, SetMethod, SYMBOLS, OptionsRemaining};
use crate::utils::bit_utils::{highest_bit_position, number_of_bits_set, power_of_2_bit_positions};

#[derive(Debug, Copy, Clone)]
pub struct Cell<'a> {
  dimensions: &'a Dimensions,

  pub column: usize,
  pub row: usize,
  pub options: u64,
  pub total_options_remaining: usize,

  pub set_method: SetMethod,
  set_column: usize,
  set_row: usize,
}

impl Display for Cell<'_> {
  fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
    if formatter.alternate() {
      write!(formatter, "{:0>1$b}", self.options, (self.dimensions.total + 1) * self.dimensions.columns - 1)
    } else {
      write!(formatter, "{:>3}", self.options)
    }
  }
}

impl<'a> Cell<'a> {
  pub fn new(dimensions: &'a Dimensions, column: usize, row: usize) -> Self {
    Cell {
      dimensions,
      column,
      row,
      options: (1 << dimensions.total) - 1, // Set all bits
      total_options_remaining: dimensions.total,
      set_method: SetMethod::Unset,
      set_column: 0,
      set_row: 0,
    }
  }

  pub fn reset(&mut self) {
    // this.setColumn = -1;
    // this.setRow = -1;

    self.set_method = SetMethod::Unset;
    self.total_options_remaining = self.dimensions.total;
    self.options = (1 << self.dimensions.total) - 1; // Set all bits
  }

  pub fn set_options_remaining(&mut self, options_remaining: &OptionsRemaining) {
    self.options = options_remaining.options;
    self.total_options_remaining = options_remaining.total_options_remaining;
  }

  pub fn equal(&self, cell: &Cell) -> bool {
    // (self.set_column == cell.set_column || cell.set_column == -1) &&
    // self.set_column == cell.set_column && self.set_row == cell.set_row && self.options == cell.options
    self.options == cell.options
  }

  pub fn solved(&self) -> bool {
    self.total_options_remaining == 1
  }

  pub fn symbol(&self) -> char {
    SYMBOLS[self.set_row * self.dimensions.columns + self.set_column]
  }

  pub fn get_options_remaining(&self) -> OptionsRemaining {
    OptionsRemaining { options: self.options, total_options_remaining: self.total_options_remaining }
  }

  pub fn remove_option_at_position(&mut self, column: usize, row: usize) -> bool {
    // Return if last option left after removing this option
    let mut last_option_found = false;
    let bit = 1 << self.dimensions.columns * row + column;

    if self.options & bit > 0 {
      // Check if option to remove exists
      self.options &= !bit;
      self.total_options_remaining -= 1;
      if self.total_options_remaining == 1 {
        self.set_remaining_option(self.options); // Set last remaining option's column and row
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      }
    }

    last_option_found
  }

  pub fn remove_option(&mut self, option: u64) -> bool {
    // Return if last option left after removing this option
    let mut last_option_found = false;

    // println!("=====>>> ({}, {}) ({}, {}) {} {} {}", self.column, self.row, self.set_column, self.set_row, self.options, option, self.total_options_remaining);
 
    // column: 2, row: 1, options: 10, total_options_remaining: 1, set_method: Calculated, set_column: 1, set_row: 0 }

    if self.options & option > 0 && self.total_options_remaining > 1 {
      // Check if option to remove exists and not last option
      self.options &= !option;
      self.total_options_remaining -= 1;
      if self.total_options_remaining == 1 {
        self.set_remaining_option(self.options); // Set last remaining option's column and row
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      }
    }

    // println!("{:?}", self);

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
        self.set_remaining_option(self.options); // Set last remaining option's column and row
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
    self.set_column = column;
    self.set_row = row;
    self.set_method = set_method;
    self.clear_all_except_at_position(self.set_column, self.set_row, self.set_method);
  }

  pub fn set_by_index(&mut self, index: usize, set_method: SetMethod) {
    self.set_column = index % self.dimensions.columns;
    self.set_row = index / self.dimensions.columns >> 0;
    self.set_method = set_method;
    self.clear_all_except_at_position(self.set_column, self.set_row, self.set_method);
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
    let bit = 1 << row * self.dimensions.columns + column;
    (self.options & bit) > 0
  }

  pub fn contains_options(&self, check_options: u64) -> bool {
    self.options & check_options == check_options
  }

  pub fn contains_symbol(&self, symbol: char) -> bool {
    self.options & 1 << find_symbol_index(symbol) > 0
  }

  fn set_remaining_option(&mut self, options: u64) {
    let index = highest_bit_position(options);
    self.set_column = index % self.dimensions.columns;
    self.set_row = index / self.dimensions.columns >> 0;
  }

  fn clear_all_except_at_position(&mut self, column: usize, row: usize, _set_method: SetMethod) {
    self.options = 1 << self.dimensions.columns * row + column;
    self.total_options_remaining = 1;
  }

  pub fn removed_options_per_row(&mut self, row: usize) -> Vec<usize> {
    let mut removed_options = Vec::with_capacity(self.dimensions.columns);

    let mut bit = 1 << row * self.dimensions.columns;
    for column in 0..self.dimensions.columns {
      if self.options & bit == 0 {
        removed_options.push(column);
      }
      bit <<= 1;                                                    // bit = 1 << row * columns + column
    }

    removed_options
  }

  //   // Remove options iff cell contains other options
  //   pub fn removeIfExtraOptions(options: number): bool {
  //     return this.totalOptionsRemaining > 1 && (this.options & ~options) > 0 && this.removeOptions(options);
  //   }

}

fn find_symbol_index(symbol: char) -> usize {
  SYMBOLS.iter().position(|&x| x == symbol).unwrap()
}