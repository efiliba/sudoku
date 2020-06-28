use wasm_bindgen::prelude::*;

pub mod utils;
pub mod cell;
pub mod sub_grid;
pub mod grid;

use grid::grid::Grid;
use cell::{dimensions::Dimensions, SetMethod};

#[wasm_bindgen]
pub fn solve(columns: usize, rows: usize, input: Vec<usize>) -> Vec<usize> {
  let dimensions = Dimensions::new(columns, rows);
  let mut grid = Grid::new(&dimensions);

  let u64_input = input.iter().map(|&x| x as u64).collect::<Vec<u64>>();
  grid.load(&u64_input);


  // grid.set_by_symbol(0, 0, 2, 1, '2', SetMethod::Loaded);
  // grid.set_by_symbol(1, 0, 0, 0, '1', SetMethod::Loaded);
  // grid.set_by_symbol(1, 0, 2, 1, '3', SetMethod::Loaded);
  // grid.set_by_symbol(0, 1, 0, 0, '4', SetMethod::Loaded);
  // grid.set_by_symbol(0, 1, 2, 1, '3', SetMethod::Loaded);
  // grid.set_by_symbol(1, 1, 0, 0, '3', SetMethod::Loaded);
  // grid.set_by_symbol(1, 1, 2, 1, '5', SetMethod::Loaded);
  // grid.set_by_symbol(0, 2, 0, 0, '3', SetMethod::Loaded);
  // grid.set_by_symbol(0, 2, 2, 1, '1', SetMethod::Loaded);
  // grid.set_by_symbol(1, 2, 0, 0, '6', SetMethod::Loaded);

  grid.solve();
  // grid.to_array()

  // println!("TEST: {:#}", grid);

  input
}
