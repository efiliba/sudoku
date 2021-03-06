use wasm_bindgen::prelude::*;

pub mod utils;
pub mod cell;
pub mod sub_grid;
pub mod grid;

use grid::grid::Grid;

#[wasm_bindgen]
pub fn solve(columns: usize, rows: usize, input: Vec<usize>) -> Vec<usize> {
  let mut grid = Grid::new(columns, rows);

  let u64_input = input.iter().map(|&x| x as u64).collect::<Vec<u64>>();
  grid.load_set_options(&u64_input);
  grid.solve();

  grid.to_options()
}
