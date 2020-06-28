use std::fmt::{self, Display};
use crate::cell::{dimensions::Dimensions, json_cell::JsonCell, SetMethod, SYMBOLS};
use crate::utils::bit_utils::{highest_bit_position, number_of_bits_set, power_of_2_bit_positions};

#[derive(Debug)]
pub struct Cell<'a> {
  dimensions: &'a Dimensions,

  pub column: usize,
  pub row: usize,
  pub options: usize,
  // pub json: JsonCell,
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

pub enum Cell2 {
  OptionsCell { column: usize, row: usize },
  SetCell { symbol: char },
}

impl Cell2 {
  pub fn new(column: usize, row: usize) -> Self {
    Cell2::OptionsCell { column, row }
  }

  // pub fn new(symbol: char) -> Self {
  //   Cell2::SetCell { symbol }
  // }

  pub fn change(&mut self) {
    *self = Cell2::SetCell { symbol: 'a' };
  }
}

impl<'a> Cell<'a> {
  pub fn new(dimensions: &'a Dimensions, column: usize, row: usize) -> Self {
    Cell {
      dimensions,
      column,
      row,
      options: (1 << dimensions.total) - 1, // Set all bits
      // json: JsonCell::new(dimensions),
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

    // self.json = JsonCell::new(COLUMNS, ROWS);
    // this.json = { rows: [] };                                        // Set JSON representation to all options available
    // for (let row: number = 0, index: number = 0; row < Cell.rows; row++) {
    //   const columns: IJsonCellColumn[] = [];
    //   for (let column = 0; column < Cell.columns; column++) {
    //     columns.push({ symbol: Cell.symbols[index++] });
    //   }
    //   this.json.rows.push({ columns: columns });
    // }
  }

  pub fn equal(&self, cell: &Cell) -> bool {
    // (self.set_column == cell.set_column || cell.set_column == -1) &&
    // self.set_column == cell.set_column && self.set_row == cell.set_row && self.options == cell.options
    self.options == cell.options
  }

  pub fn solved(&self) -> bool {
    self.total_options_remaining == 1
  }

  //   constructor(pub fn column: any, pub fn row?: number) {
  //     if (typeof column === "number") {
  //       this.reset();
  //     } else {                                                         // Copy constructor
  //       const copy: Cell = column;
  //       this.column = copy.column;
  //       this.row = copy.row;
  //       this.setMethod = copy.setMethod;

  //       this.options = copy.options;
  //       this.setColumn = copy.setColumn;
  //       this.setRow = copy.setRow;
  //       this.totalOptionsRemaining = copy.totalOptionsRemaining;

  //       this.json = copy.json;

  //       if (copy.json.rows) {
  //         this.json = { rows: [] };
  //         for (let row: number = 0; row < copy.json.rows.length; row++) {
  //           this.json.rows[row] = { columns: [] };
  //           const jsonColumns: IJsonCellColumn[] = copy.json.rows[row].columns;
  //           for (let column = 0; column < jsonColumns.length; column++) {
  //             this.json.rows[row].columns[column] = { symbol: jsonColumns[column].symbol };
  //             if (jsonColumns[column].strikeOut) {
  //               this.json.rows[row].columns[column].strikeOut = jsonColumns[column].strikeOut;
  //             }
  //           }
  //         }
  //       } else {
  //         this.json = { symbol: copy.json.symbol, setMethod: copy.json.setMethod };
  //       }
  //     }
  //   }

  //   pub fn equal(cell: Cell): bool {
  //     return (this.setColumn === cell.setColumn || cell.setColumn === -1) &&
  //       (this.setRow === cell.setRow || cell.setRow === -1) && this.options === cell.options;
  //     //return this.options === cell.options;
  //   }

  pub fn symbol(&self) -> char {
    SYMBOLS[self.set_row * self.dimensions.columns + self.set_column]
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
                                                 //     this.json = { symbol: Cell.symbols[powerOf2BitPositions[this.options]] };
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
        //   } else {
        //     this.json.rows[row].columns[column].strikeOut = true;       // Only set strikeOut to true if option removed - else leave empty
      }
    }

    last_option_found
  }

  //   pub fn toggleRemoveOptionAtPositionShallow(column: number, row: number): void {
  //     const cell = this.json.rows[row].columns[column];
  //     cell.strikeOut = !cell.strikeOut;
  //   }

  //   pub fn toggleHighlightOptionAtPosition(column: number, row: number): void {
  //     const cell = this.json.rows[row].columns[column];
  //     cell.highlight = !cell.highlight;
  //   }

  pub fn remove_option(&mut self, option: usize) -> bool {
    // Return if last option left after removing this option
    let mut last_option_found = false;

    if self.options & option > 0 && self.total_options_remaining > 1 {
      // Check if option to remove exists and not last option
      self.options &= !option;
      self.total_options_remaining -= 1;
      if self.total_options_remaining == 1 {
        self.set_remaining_option(self.options); // Set last remaining option's column and row
                                                 //         this.json = { symbol: Cell.symbols[powerOf2BitPositions[this.options]] };
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
        //       }
        //       else {
        //         const index: number = powerOf2BitPositions[option];
        //         this.json.rows[index / Cell.columns >> 0].columns[index % Cell.columns].strikeOut = true;
      }
    }

    last_option_found
  }

  pub fn remove_options(&mut self, remove: usize) -> bool {
    let mut last_option_found = false;

    let mut remove_options = self.options & remove;
    if remove_options > 0 && self.total_options_remaining > 1 && self.options & !remove > 0 {
      // Remove options iff cell contains other options
      self.options -= remove_options;
      self.total_options_remaining -= number_of_bits_set(remove_options);

      if self.total_options_remaining == 1 {
        self.set_remaining_option(self.options); // Set last remaining option's column and row
        // self.json = { symbol: Cell.symbols[powerOf2BitPositions[self.options]] };
        self.set_method = SetMethod::Calculated;
        last_option_found = true;
      } else {
        while remove_options > 0 {
          let highest_bit_pos = highest_bit_position(remove_options);
          // self.json.rows[highest_bit_pos / Cell.columns >> 0].columns[highest_bit_pos % Cell.columns].strikeOut = true;
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

  fn set_by_index(&mut self, index: usize, set_method: SetMethod) {
    self.set_column = index % self.dimensions.columns;
    self.set_row = index / self.dimensions.columns >> 0;
    self.set_method = set_method;
    self.clear_all_except_at_position(self.set_column, self.set_row, self.set_method);
  }

  pub fn set_by_option(&mut self, option: usize, set_method: SetMethod) {
    self.set_by_index(power_of_2_bit_positions(option), set_method);
  }

  pub fn set_by_symbol(&mut self, symbol: char, set_method: SetMethod) {
    self.set_by_index(find_symbol_index(symbol), set_method);
  }

  pub fn contains_option(&self, option: usize) -> bool {
    self.options & option > 0
  }

  pub fn contains_option_at_position(&self, column: usize, row: usize) -> bool {
    let bit = 1 << row * self.dimensions.columns + column;
    (self.options & bit) > 0
  }

  pub fn contains_options(&self, check_options: usize) -> bool {
    self.options & check_options == check_options
  }

  pub fn contains_symbol(&self, symbol: char) -> bool {
    self.options & 1 << find_symbol_index(symbol) > 0
  }

  fn set_remaining_option(&mut self, options: usize) {
    let index = highest_bit_position(options);
    self.set_column = index % self.dimensions.columns;
    self.set_row = index / self.dimensions.columns >> 0;
  }

  //   // private clearAllExcept(option: number, fix: bool) {
  //   //   this.options = option;
  //   //   this.json = { symbol: Cell.symbols[powerOf2BitPositions[option]], fixed: fix };
  //   //   this.totalOptionsRemaining = 1;
  //   // }

  fn clear_all_except_at_position(&mut self, column: usize, row: usize, set_method: SetMethod) {
    self.options = 1 << self.dimensions.columns * row + column;
    // this.json = { symbol: Cell.symbols[powerOf2BitPositions[this.options]], setMethod };
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

  //   pub fn setJson(json: IJsonCell) {
  //     if (json.rows) {
  //       this.options = 0;
  //       this.totalOptionsRemaining = 0;
  //       for (let row: number = 0, option: number = 1; row < json.rows.length; row++) {
  //         const columns: IJsonCellColumn[] = json.rows[row].columns;
  //         for (let column = 0; column < columns.length; column++, option <<= 1) {
  //           if (!columns[column].strikeOut) {
  //             this.options += option;
  //             this.totalOptionsRemaining++;
  //           }
  //         }
  //       }
  //     } else {
  //       this.setBySymbol(json.symbol, json.setMethod);
  //     }

  //     this.json = json;
  //   }
  // }
}

fn find_symbol_index(symbol: char) -> usize {
  SYMBOLS.iter().position(|&x| x == symbol).unwrap()
}