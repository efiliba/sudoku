pub mod grid;

mod grid_test;

pub struct CellOptions {
  pub column: usize,
  pub row: usize,
  pub options: u64
}
