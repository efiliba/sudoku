use crate::cell::json_cell::JsonCell;

pub mod sub_grid;

mod sub_grid_test;

#[derive(Debug)]
pub struct BitOption {
  pub sub_grid_column: usize,
  pub sub_grid_row: usize,
  pub cell_column: usize,
  pub cell_row: usize,
  pub bits: usize
}

pub struct StruckOutCells {
  pub last_options_found: Vec<BitOption>,
  pub removed_options_from_column: Vec<BitOption>,
  pub removed_options_from_row: Vec<BitOption>
}


pub struct JsonSubGridRow {
  columns: Vec<JsonCell>
}

pub struct JsonSubGrid {
  rows: Vec<JsonSubGridRow>
}
