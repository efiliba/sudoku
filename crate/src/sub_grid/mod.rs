pub mod sub_grid;

mod sub_grid_test;

#[derive(Debug)]
pub struct BitOption {
  pub sub_grid_column: usize,
  pub sub_grid_row: usize,
  pub cell_column: usize,
  pub cell_row: usize,
  pub bits: u64
}

pub struct StruckOutCell {
  pub last_option_found: Option<BitOption>,
  pub remove_option_from_column: Option<BitOption>,
  pub remove_option_from_row: Option<BitOption>
}

pub struct StruckOutCells {
  pub last_options_found: Vec<BitOption>,
  pub removed_options_from_column: Vec<BitOption>,
  pub removed_options_from_row: Vec<BitOption>
}

impl StruckOutCells {
  pub fn new() -> Self {
    Self {
      last_options_found: Vec::new(),
      removed_options_from_column: Vec::new(),
      removed_options_from_row: Vec::new()
    }
  }

  pub fn add(&mut self, struck_out_cell: StruckOutCell) {
    match struck_out_cell.last_option_found {
      Some(option) => self.last_options_found.push(option),
      None => ()
		}
    match struck_out_cell.remove_option_from_column {
      Some(option) => self.removed_options_from_column.push(option),
      None => ()
		}
    match struck_out_cell.remove_option_from_row {
      Some(option) => self.removed_options_from_row.push(option),
      None => ()
		}
  }
}
