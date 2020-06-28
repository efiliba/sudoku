use crate::cell::cell::Cell;
use crate::sub_grid::JsonSubGrid;

pub mod grid;

mod grid_test;

pub struct LimitedBitOption {                                       // Options limited to a column, row or both (sub-grid)
  pub column: usize,
  pub row: usize,
  pub options: u64
}

pub struct UnsetCells<'a> {
  pub column: usize,
  pub row: usize,
  pub cells: Vec<Cell<'a>>
}

pub struct JsonGridRow {
  pub columns: Vec<JsonSubGrid>
}

pub struct JsonGrid {
  pub rows: Vec<JsonGridRow>
}
