use std::fmt::{self, Display};
use crate::utils::combinations::Combinations;
use crate::utils::bit_utils::{number_of_bits_set, bitwise_or, only_option, containing_bit_index};
use crate::cell::{cell::Cell, dimensions::Dimensions, SetMethod, SYMBOLS};
use crate::sub_grid::{sub_grid::SubGrid, BitOption, StruckOutCells};
use crate::grid::{LimitedBitOption, UnsetCells};
use crate::utils::array_utils;

#[derive(Debug)]
pub struct Grid<'a> {
  dimensions: &'a Dimensions,
  combinations: Combinations,
  
  sub_grids: Vec<Vec<SubGrid<'a>>>,                                 // use get(column, row) -> returns sub-grids[row][column]
  total_set: usize
}

impl Display for Grid<'_> {
  fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
    let options_rows = self.available_options_rows();
    let transposed_rows = array_utils::transpose_rows(self.dimensions.columns, &options_rows);
    let mut output = String::new();
    
    for row in transposed_rows.iter() {
      fmt::write(&mut output, format_args!("{:?}\n", row)).expect("Error writing cell in grid");
    }

    write!(formatter, "{}", output)
  }
}

impl<'a> Grid<'a> {
  pub fn new(dimensions: &'a Dimensions) -> Self {
    let mut sub_grids: Vec<Vec<SubGrid>> = Vec::with_capacity(dimensions.rows);

    for row in 0..dimensions.rows {
      sub_grids.push(Vec::with_capacity(dimensions.columns));
      let swopped = dimensions.swop();
      for column in 0..dimensions.columns {
        sub_grids[row].push(SubGrid::new(swopped, column, row));
      }
    }
  
    Grid {
      dimensions,
      combinations: Combinations::new(dimensions.total),
      sub_grids,
      total_set: 0
    }
  }

  pub fn reset(&mut self) {
    for row in 0..self.dimensions.rows {
      for column in 0..self.dimensions.columns {
        self.sub_grids[row][column].reset();
      }
    }
    self.total_set = 0;
  }

  pub fn get(&self, column: usize, row: usize) -> &SubGrid {
    // sub-grids called by [column, row] but accessed by [row][column] for efficiency
    &self.sub_grids[row][column]
  } 
  
  pub fn compare(&self, items: &Vec<Vec<SubGrid>>) -> bool {
    let mut equal = true;
    let mut row = self.dimensions.rows;
    while equal && row > 0 {
      row -= 1;
      let mut column = self.dimensions.columns;
      while equal && column > 0 {
        column -= 1;
        let matrix = items[row][column].get_cells_matrix();
        equal = self.sub_grids[row][column].compare_ref(&matrix);
      }
    }

    equal
  }

  pub fn available_options_rows(&self) -> Vec<Vec<u64>> {
    let mut options_rows = Vec::with_capacity(self.dimensions.total);
    for row in 0..self.dimensions.rows {
      for column in 0..self.dimensions.columns {
        options_rows.push(self.sub_grids[row][column].available_options_row());
      }
    }

    options_rows
  }

  pub fn set_options(&mut self, options: &Vec<Vec<u64>>) {
    for row in 0..self.dimensions.rows {
      for column in 0..self.dimensions.columns {
        self.sub_grids[row][column].set_options(&options[row * self.dimensions.columns + column]);
      }
    }
  }

  // pub fn available_options_rows(&self) -> Vec<Vec<usize>> {
  //   let mut options_rows = Vec::with_capacity(self.dimensions.rows);
  //   for row in 0..self.dimensions.rows {
  //     let mut options_row = Vec::with_capacity(self.dimensions.columns);
  //     for column in 0..self.dimensions.columns {
  //       options_row.extend(self.sub_grids[row][column].available_options_row());
  //     }
  //     options_rows.push(options_row);
  //   }

  //   options_rows
  // }

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

  // pub fn solve({
  //   restart,
  //   eliminateAfter = 0,                            - NOT NEEDED
  //   maxRecursionLevel = 1,
  // }: {
  //   restart?: bool;
  //   eliminateAfter?: usize;
  //   maxRecursionLevel?: usize;
  // } = {}): bool {
  //   if (restart) {
  //     self.strikeOutFromSetCells();                  - MIGHT NOT BE NEEDED
  //   }

  //   do {
  //     // Repeat while an only option found or an option removed
  //     while (self.simplify());
  //   } while (
  //     self.total_set > eliminateAfter &&
  //     maxRecursionLevel > 0 &&
  //     self.eliminate(self.dimensions.columns * self.dimensions.rows, maxRecursionLevel)
  //   );

  //   self.solved()
  // }

  pub fn solved(&self) -> bool {
    let mut solved = true;

    let mut row = self.dimensions.rows;
    while solved && row > 0 {
      row -= 1;
      let mut column = self.dimensions.columns;
      while solved && column > 0 {
        column -= 1;
        solved = self.sub_grids[row][column].solved();
      }
    }

    solved
  }
  
/*
  public removeOptionAtPosition(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ): bool {
    const cell: ICell = self.sub_grids[sub_grid_row][sub_grid_column].get(
      cell_column,
      cell_row
    );
    if (cell.removeOptionAtPosition(option_column, option_row)) {
      // Check if last option left
      self.total_set++;
      self.strike_out(
        sub_grid_column,
        sub_grid_row,
        cell_column,
        cell_row,
        cell.options
      ); // Remaining option
      return true;
    } else {
      return false;
    }
  }
*/
  fn remove_option(&self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ) -> bool {
    // let cell: ICell = self.sub_grids[sub_grid_row][sub_grid_column].get(
    //   cell_column,
    //   cell_row
    // );
    // if (cell.removeOption(option)) {
    //   // Check if last option left
    //   self.total_set++;
    //   self.strike_out(
    //     sub_grid_column,
    //     sub_grid_row,
    //     cell_column,
    //     cell_row,
    //     cell.options
    //   ); // Remaining option
    //   return true;
    // } else {
    //   return false;
    // }

    false
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
  
  // pub fn load(&mut self, input: &Vec<u64>) {
  //   let grouped = array_utils::group_by_root(input);
  //   let transposed = array_utils::transpose_rows(self.dimensions.columns, &grouped);

  //   let mut sub_group_iter = transposed.iter();
  //   for row in 0..self.dimensions.rows {
  //     for column in 0..self.dimensions.columns {
  //       self.sub_grids[row][column].load(sub_group_iter.next().unwrap());
  //     }
  //   }
  // }

  pub fn load_set_options(&mut self, options: &Vec<u64>) {
    let grouped = array_utils::group_by_root(options);

    for sub_grid_row in 0..self.dimensions.rows {
      for sub_grid_column in 0..self.dimensions.columns {
        let sub_grid_options = &grouped[sub_grid_row * self.dimensions.columns + sub_grid_column];
        for cell_row in 0..self.dimensions.columns {                // dimensions columns & rows swopped
          for cell_column in 0..self.dimensions.rows {
            let option = sub_grid_options[cell_row * self.dimensions.rows + cell_column];
            if option > 0 {
              self.set_by_option(sub_grid_column, sub_grid_row, cell_column, cell_row, option, SetMethod::Loaded);
            }
          }
        }
      }
    }
  }

/*
  public debug(log: bool = true): DebugSubGridType[][] {
    const rows: DebugSubGridType[][] = [];

    let row: usize = self.dimensions.rows;
    while (row--) {
      let column: usize = self.dimensions.columns;
      const subGridsRow: DebugSubGridType[] = [];
      while (column--) {
        subGridsRow.unshift(self.sub_grids[row][column].debug(false));
      }
      rows.unshift(subGridsRow);
    }

    if (log) {
      while (++row < self.dimensions.rows) {
        console.log(rows[row].join(" | "));
      }
      console.log(Array(rows[0].len() + 1).join("---"));
    }

    return rows;
  }
*/

  fn is_valid(&self) -> bool {
    // let valid =
    //   self.matrixValid(self.get_transposed_cells_matrix()) &&
    //   self.matrixValid(self.get_cells_matrix()); // Check columns and rows contain all options and no set cell duplicted

    // return valid;

    false
  }

/*
  fn matrixValid(matrix: ICell[][]): bool {
    let valid: bool = true;
    const size: usize = self.dimensions.columns * self.dimensions.rows;
    let index: usize = size;
    while valid && index > 0 {
      index -= 1;
      let setOptions: usize[] = self.setDistinctOptions(matrix[index]); // Get unique set cells
      let unsetOptions: usize[] = self.unsetOptions(matrix[index]);

      valid =
        setOptions.len() + unsetOptions.len() === size && // Ensures setOptions did not contain duplicates
        (bitwise_or(setOptions) | bitwise_or(unsetOptions)) === (1 << size) - 1; // totalSetOptions | totalUnsetOptions must contain all the options
    }

    return valid;
  }

  fn setDistinctOptions(cells: ICell[]): usize[] {
    // cells.Where(x => x.IsSet).GroupBy(x => x.Options).Where(x => x.Count() == 1).Select(x => x.Key);
    let distinct: usize[] = [];
    let hash = {};
    for (let index: usize = 0; index < cells.len(); index++) {
      let options: usize = cells[index].options;
      if (cells[index].set_method && !hash[options]) {
        // cell set i.e. != SetMethod.unset
        distinct.push(options);
        hash[options] = true;
      }
    }

    return distinct;
  }

  fn unsetOptions(cells: ICell[]): usize[] {
    // cells.Where(x => !x.IsSet).Select(x => x.Options)
    let options: usize[] = [];
    for (let index: usize = 0; index < cells.len(); index++) {
      if (!cells[index].set_method) {
        // cell unset i.e. == SetMethod.unset
        options.push(cells[index].options);
      }
    }

    return options;
  }

  fn load(cells: ICell[]) {
    const subGrid: ICell[][] = [];
    for (let row: usize = 0; row < self.dimensions.columns; row++) {
      // Use SubGrid's number of rows i.e. swopped columns
      subGrid[row] = [];
    }
    let size: usize = self.dimensions.columns * self.dimensions.rows;

    for (let sub_grid_row: usize = 0; sub_grid_row < self.dimensions.rows; sub_grid_row++) {
      for (
        let sub_grid_column: usize = 0;
        sub_grid_column < self.dimensions.columns;
        sub_grid_column++
      ) {
        for (let cell_row: usize = 0; cell_row < self.dimensions.columns; cell_row++) {
          for (
            let cell_column: usize = 0;
            cell_column < self.dimensions.rows;
            cell_column++
          ) {
            subGrid[cell_row][cell_column] =
              cells[
                sub_grid_row * size * self.dimensions.columns +
                  sub_grid_column * self.dimensions.rows +
                  cell_row * size +
                  cell_column
              ];
          }
        }

        self.sub_grids[sub_grid_row][sub_grid_column].setCells(subGrid);
      }
    }
  }

  public save(): ICell[] {
    let size: usize = self.dimensions.columns * self.dimensions.rows;
    let cells: ICell[] = [];

    for (let sub_grid_row: usize = 0; sub_grid_row < self.dimensions.rows; sub_grid_row++) {
      for (
        let sub_grid_column: usize = 0;
        sub_grid_column < self.dimensions.columns;
        sub_grid_column++
      ) {
        let sub_matrix = self.sub_grids[sub_grid_row][
          sub_grid_column
        ].get_cells_matrix();
        for (let cell_row = 0; cell_row < self.dimensions.columns; cell_row++) {
          for (let cell_column = 0; cell_column < self.dimensions.rows; cell_column++) {
            cells[
              sub_grid_row * size * self.dimensions.columns +
                sub_grid_column * self.dimensions.rows +
                cell_row * size +
                cell_column
            ] = sub_matrix[cell_row][cell_column];
          }
        }
      }
    }

    return cells;
  }
*/

  fn eliminate(&mut self) -> bool {
    let save = self.available_options_rows();                       // Save current state
    let save_total_set = self.total_set;
  
    // println!("*** 1: {:?}", save);


    let mut valid = true;
    let mut total_unset_options = 1;
    while valid {
      let mut row_pos = self.dimensions.rows;

      while valid && row_pos > 0 {
      // while (valid && row_pos-- > 0) {   // MAY be set bellow 0
        
        // Could use pos instead of index ???
        println!("*** row_pos: {}", row_pos);

        // row_pos -= 1;
        let mut column_pos = self.dimensions.columns;
        while valid && column_pos > 0 {

          println!("***** column_pos: {}", column_pos);

          // column_pos -= 1;
  //         let unset_cells: IUnsetCells = self.unset_cells(
          let unset_cells = self.unset_cells(column_pos, row_pos, total_unset_options); // May reduce column and row indices
          column_pos = unset_cells.column; // MAY need to +1
          row_pos = unset_cells.row;

          let mut index = unset_cells.cells.len();
          while valid && index > 0 {

            println!("******* index: {}", index);

            index -= 1;
            let cell = unset_cells.cells[index];

            let mut options = cell.options;
            let cell_column = cell.column;
            let cell_row = cell.row;

            // println!("+++++++++ {} {} {}", options, cell_column, cell_row);

            let mut try_option = options & !(options - 1); // lowest set bit value
            while try_option > 0 && valid {
              // self.set_by_option(
              //   column_pos - 1,
              //   row_pos - 1,
              //   cell_column,
              //   cell_row,
              //   try_option,
              //   SetMethod::Calculated
              // );
              // self.solve();
              // valid = self.is_valid();

              // self.set_options(&save);                              // Reset
              // self.total_set = save_total_set;

              if valid {
                options -= try_option;                              // remove tried option
                try_option = options & !(options - 1);
              } else {
                 // Remove try_option i.e. resulted in an invalid state
                // self.remove_option(column_pos - 1, row_pos - 1, cell_column, cell_row, try_option);
              }
            }
          }

          column_pos -= 1;
        }

        row_pos -= 1;
      }
      valid = false;
    }


  //   return !valid; // Option removed?
  // }


    println!("2: {:?}", self.to_options());

    // Load without solving / simplifying
    // use set_by_option_shallow ???

    // [48, 4, 56, 49, 57, 2, 1, 58, 42, 24, 56, 4, 8, 51, 48, 35, 35, 4, 4, 35, 35, 10, 43, 16, 4, 26, 24, 50, 58, 1, 32, 27, 11, 26, 4, 10]
    
    false
  }

  fn unset_cells(&mut self, column: usize, row: usize, total_unset_options: usize) -> UnsetCells {
    let mut cells: Vec<Cell> = Vec::new();

    let mut column_pos = column;
    let mut row_pos = row;
    let mut set = false;
    while !set && row_pos > 0 {
      while !set && column_pos > 0 {
        cells = self.sub_grids[row_pos - 1][column_pos - 1].unset_cells(total_unset_options);
        set = cells.len() > 0;
        if !set {
          column_pos -= 1;
        }
      }

      if !set {
        row_pos -= 1;
        if row_pos > 0 {
          column_pos = self.dimensions.columns;
        }
      }
    }

    // println!("{} {} {:?}", column_pos, row_pos, cells);

    UnsetCells { column: column_pos, row: row_pos, cells }
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

    self.total_set += struck_out_cells.last_options_found.len();
  }
/*  
  public isStruckOut(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    symbol: string
  ): bool {
    return self.sub_grids[sub_grid_row][sub_grid_column].isStruckOut(
      cell_column,
      cell_row,
      symbol
    );
  }
*/
  pub fn fix_by_position(
    &mut self,
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ) {
    if self.sub_grids[sub_grid_row][sub_grid_column].set_by_position(
      cell_column,
      cell_row,
      option_column,
      option_row,
      SetMethod::Loaded
    ) {
      self.total_set += 1;
    }

    let option = 1 << (self.dimensions.columns * option_row + option_column);
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
    if self.sub_grids[sub_grid_row][sub_grid_column].set_by_option(cell_column, cell_row, option, set_method) {
      self.total_set += 1;
    }

    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
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
    if option > 0 {
      self.total_set += 1;
    }

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
    if option > 0 {
      self.total_set += 1;
    }

    self.strike_out(sub_grid_column, sub_grid_row, cell_column, cell_row, option);
  }

  pub fn to_options(&mut self) -> Vec<usize> {
    self.available_options_rows().iter()
      .flat_map(|x| x.iter().map(|&x| x  as usize)).collect()
  }

/*
  public setByPositionShallow(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize,
    set_method: SetMethod = SetMethod.user
  ) {
    if (
      self.sub_grids[sub_grid_row][sub_grid_column].set_by_position(
        cell_column,
        cell_row,
        option_column,
        option_row,
        set_method
      )
    ) {
      self.total_set++;
    }
  }

  public toggleStrikeOutAtPositionShallow(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ) {
    const cell: ICell = self.sub_grids[sub_grid_row][sub_grid_column].get(
      cell_column,
      cell_row
    );
    cell.toggleRemoveOptionAtPositionShallow(option_column, option_row);
  }

  public togglePencilInAtPositionShallow(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ) {
    const cell: ICell = self.sub_grids[sub_grid_row][sub_grid_column].get(
      cell_column,
      cell_row
    );
    cell.toggleHighlightOptionAtPosition(option_column, option_row);
  }

  public fixByOptions(fixedOptions: usize[]) {
    for (let sub_grid_row: usize = 0; sub_grid_row < self.dimensions.rows; sub_grid_row++) {
      for (
        let sub_grid_column: usize = 0;
        sub_grid_column < self.dimensions.columns;
        sub_grid_column++
      ) {
        for (let cell_row: usize = 0; cell_row < self.dimensions.columns; cell_row++) {
          for (
            let cell_column: usize = 0;
            cell_column < self.dimensions.rows;
            cell_column++
          ) {
            const option =
              fixedOptions[
                (sub_grid_row * self.dimensions.columns + cell_row) *
                  self.dimensions.columns *
                  self.dimensions.rows +
                  sub_grid_column * self.dimensions.rows +
                  cell_column
              ];
            if (option) {
              self.total_set++;
              self.sub_grids[sub_grid_row][sub_grid_column]
                .get(cell_column, cell_row)
                .setByOption(option, SetMethod.loaded);
              self.strike_out(
                sub_grid_column,
                sub_grid_row,
                cell_column,
                cell_row,
                option
              );
            }
          }
        }
      }
    }
  }

  public fixByCsv(options: string) {
    let option: u64;
    for (let sub_grid_row: usize = 0; sub_grid_row < self.dimensions.rows; sub_grid_row++) {
      for (
        let sub_grid_column: usize = 0;
        sub_grid_column < self.dimensions.columns;
        sub_grid_column++
      ) {
        for (let cell_row: usize = 0; cell_row < self.dimensions.columns; cell_row++) {
          for (
            let cell_column: usize = 0;
            cell_column < self.dimensions.rows;
            cell_column++
          ) {
            //                int.TryParse(options.Substring((sub_grid_row * columns + cell_row) * columns * rows + sub_grid_column * rows + cell_column, 1), out option);
            if (option) {
              self.total_set++;
              option = 1 << (option - 1);
              self.sub_grids[sub_grid_row][sub_grid_column]
                .get(cell_column, cell_row)
                .setByOption(option, SetMethod.loaded);
              self.strike_out(
                sub_grid_column,
                sub_grid_row,
                cell_column,
                cell_row,
                option
              );
            }
          }
        }
      }
    }
  }

  public unfix(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize
  ) {
    self.sub_grids[sub_grid_row][sub_grid_column].get(cell_column, cell_row).reset();

    const fixedCells: usize[] = [];
    const cells: ICell[] = self.getCellsArray();
    for (let index: usize = 0; index < cells.len(); index--) {
      fixedCells.push(
        cells[index].set_method === SetMethod.loaded ||
          cells[index].set_method === SetMethod.user
          ? cells[index].options
          : 0
      ); // Get fixed cells i.e. 0, 0, 0, 8, 4, 0, 0, 1, ...
    }

    self.reset();
    self.fixByOptions(fixedCells);
    self.solve();
  }

  fn getCellsArray(): ICell[] {
    let array: ICell[] = [];

    let sub_grid_row: usize = self.dimensions.rows;
    while (sub_grid_row--) {
      let sub_grid_column: usize = self.dimensions.columns;
      while (sub_grid_column--) {
        let sub_matrix = self.sub_grids[sub_grid_row][
          sub_grid_column
        ].get_cells_matrix();

        let cell_column: usize = self.dimensions.rows;
        while (cell_column--) {
          let cell_row: usize = self.dimensions.columns;
          while (cell_row--) {
            array[
              (sub_grid_row * self.dimensions.columns + cell_row) * self.dimensions.columns * self.dimensions.rows +
                sub_grid_column * self.dimensions.rows +
                cell_column
            ] = sub_matrix[cell_row][cell_column];
          }
        }
      }
    }

    return array;
  }

  // Remove option from the other sub grid's columns / rows when the option must belong in a specific sub grid's column / row
  public removeUnavailableOptionsAtPosition(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option_column: usize,
    option_row: usize
  ): bool {
    return self.removeUnavailableOptions(
      sub_grid_column,
      sub_grid_row,
      cell_column,
      cell_row,
      1 << (self.dimensions.columns * option_row + option_column)
    );
  }

  fn removeUnavailableOptions(
    sub_grid_column: usize,
    sub_grid_row: usize,
    cell_column: usize,
    cell_row: usize,
    option: u64
  ): bool {
    let last_options: IOption[] = [];

    // Check sub grid's column and if found remove option from other columns
    if (
      self.sub_grids[sub_grid_row][sub_grid_column].optionRemovedFromColumn(
        cell_column,
        cell_row,
        option
      )
    ) {
      last_options = self.removeOptionFromOtherColumns(
        sub_grid_column,
        sub_grid_row,
        cell_column,
        option
      );
    }

    // Check sub grid's row and if found remove option from other rows
    if (
      self.sub_grids[sub_grid_row][sub_grid_column].optionRemovedFromRow(
        cell_column,
        cell_row,
        option
      )
    ) {
      last_options = self.removeOptionFromOtherRows(
        sub_grid_column,
        sub_grid_row,
        cell_row,
        option
      );
    }

    let last_option: IOption;
    let index: usize = last_options.len();
    while index > 0 {
      index -= 1;
      last_option = last_options[index];
      self.strike_out(
        last_option.sub_grid_column,
        last_option.sub_grid_row,
        last_option.cell_column,
        last_option.cell_row,
        last_option.bits
      );
    }

    return last_options !== null;
  }
*/
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

  fn find_options_limited_to_matrix(&self, cells: Vec<Vec<&Cell>>) -> Vec<LimitedBitOption> {
    let mut limited_options: Vec<LimitedBitOption> = Vec::new();
    let mut unset_cells: Vec<&Cell> = Vec::new();
    let mut pick_options: Vec<&Cell> = Vec::new();
    let mut combination_options: Vec<u64> = Vec::new();

    for cell_index in 0..self.dimensions.total {
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
            limited_options.push(LimitedBitOption {
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

  fn find_options_limited_to_sub_grids(&self) -> Vec<LimitedBitOption> {
    let mut limited_options = Vec::new();
    let mut pick_options: Vec<&Cell> = Vec::new();
    let mut combination_options = Vec::new();
    
    for row in 0..self.dimensions.rows {
      for column in 0..self.dimensions.columns {
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
              limited_options.push(LimitedBitOption {
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

  fn remove_if_extra_options_from_column(&mut self, limited_options: &Vec<LimitedBitOption>) -> bool {
    let mut last_options = Vec::new();

    let mut index = limited_options.len();
    while index > 0 {
      index -= 1;
      let limited_option = &limited_options[index];
      for row in 0..self.dimensions.rows {
        last_options.append(&mut self.sub_grids[row][
            (limited_option.column / self.dimensions.rows) >> 0
          ].remove_if_extra_options_from_column(
            limited_option.column % self.dimensions.rows,
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

    self.total_set += last_options.len();
    last_options.len() > 0
  }

  fn remove_if_extra_options_from_row(&mut self, limited_options: &Vec<LimitedBitOption>) -> bool {
    let mut last_options = Vec::new();

    let mut index = limited_options.len();
    while index > 0 {
      index -= 1;
      let limited_option = &limited_options[index];
      for column in 0..self.dimensions.columns {
        last_options.append(
          &mut self.sub_grids[(limited_option.row / self.dimensions.columns) >> 0][column]
            .remove_if_extra_options_from_row(
              limited_option.row % self.dimensions.columns,
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

    self.total_set += last_options.len();
    last_options.len() > 0
  }

  fn remove_if_extra_options_from_sub_grid(&mut self, limited_options: &Vec<LimitedBitOption>) -> bool {
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

    self.total_set += last_options.len();
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
    let mut row = self.dimensions.rows - 1;
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
    let mut column = self.dimensions.columns - 1;
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
    let mut column = self.dimensions.total;
    while !only_option_found && column > 0 {
      column -= 1;
      let (found, bit) = only_option(&matrix[column]);

      if found {
        only_option_found = true;
        let matrix_row = containing_bit_index(&matrix[column], bit);  // Row within grid where only option found
        self.set_by_option(
          (column / self.dimensions.rows) >> 0,
          (matrix_row / self.dimensions.columns) >> 0,
          column % self.dimensions.rows,
          matrix_row % self.dimensions.columns,
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
    let mut row = self.dimensions.total;
    while !only_option_found && row > 0 {
      row -= 1;
      let (found, bit) = only_option(&matrix[row]);

      if found {
        only_option_found = true;
        let matrix_column = containing_bit_index(&matrix[row], bit);  // Column within grid where only option found
        self.set_by_option(
          (matrix_column / self.dimensions.rows) >> 0,
          (row / self.dimensions.columns) >> 0,
          matrix_column % self.dimensions.rows,
          row % self.dimensions.columns,
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
    let mut row = self.dimensions.rows;
    while !only_option_found && row > 0 {
      row -= 1;

      let mut column = self.dimensions.columns;
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
            array_index % self.dimensions.rows,
            (array_index / self.dimensions.rows) >> 0,
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
    let mut column = &self.dimensions.rows - 1;                     // Use SubGrid's number of columns i.e. swopped rows
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
      let mut row = &self.dimensions.rows - 1;
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
    let mut row = self.dimensions.columns - 1;                      // Use SubGrid's number of rows i.e. swopped columns
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
      let mut column = self.dimensions.columns - 1;
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
    let mut matrix = Vec::with_capacity(self.dimensions.total);
    for _ in 0..self.dimensions.total {
      matrix.push(Vec::new());
    }
    
    for sub_grid_row in 0..self.dimensions.rows {
      for sub_grid_column in 0..self.dimensions.columns {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_available_options_matrix();

        for cell_column in 0..self.dimensions.rows {
          for cell_row in 0..self.dimensions.columns {
            let matrix_column = sub_grid_column * self.dimensions.rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }

  fn get_transposed_available_options_matrix(&self) -> Vec<Vec<u64>> {
    // Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.dimensions.total);
    for _ in 0..self.dimensions.total {
      matrix.push(Vec::new());
    }

    for sub_grid_column in 0..self.dimensions.columns {
      for sub_grid_row in 0..self.dimensions.rows {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_available_options_matrix();

        for cell_row in 0..self.dimensions.columns {
          for cell_column in 0..self.dimensions.rows {
            let matrix_column = sub_grid_column * self.dimensions.rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }

  fn get_cells_matrix(&self) -> Vec<Vec<&Cell>> {
    // Get cells in current grid - returned as an n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.dimensions.total);
    for _ in 0..self.dimensions.total {
      matrix.push(Vec::new());
    }
    
    for sub_grid_row in 0..self.dimensions.rows {
      for sub_grid_column in 0..self.dimensions.columns {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_cells_matrix();

        for cell_column in 0..self.dimensions.rows {
          for cell_row in 0..self.dimensions.columns {
            let matrix_column = sub_grid_column * self.dimensions.rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }

  fn get_transposed_cells_matrix(&self) -> Vec<Vec<&Cell>> {
    // Get state of current grid - returned as a transposed n*m matrix (not separated by sub grids)
    let mut matrix = Vec::with_capacity(self.dimensions.total);
    for _ in 0..self.dimensions.total {
      matrix.push(Vec::new());
    }

    for sub_grid_column in 0..self.dimensions.columns {
      for sub_grid_row in 0..self.dimensions.rows {
        let sub_matrix = self.sub_grids[sub_grid_row][sub_grid_column].get_cells_matrix();

        for cell_row in 0..self.dimensions.columns {
          for cell_column in 0..self.dimensions.rows {
            let matrix_column = sub_grid_column * self.dimensions.rows + cell_column;
            matrix[matrix_column].push(sub_matrix[cell_row][cell_column]);
          }
        }
      }
    }

    matrix
  }
}
