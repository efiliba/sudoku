pub mod grid;

mod grid_test;

pub struct CellOptions {                                       // Options limited to a column, row or both (sub-grid)
  pub column: usize,
  pub row: usize,
  pub options: u64
}
