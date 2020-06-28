// use std::fmt::{self, Display};
use crate::cell::SYMBOLS;

#[derive(Debug)]
pub struct JsonCellColumn {
  symbol: char,
  strike_out: bool,
  highlight: bool
}

// impl Display for JsonCellColumn {
//   fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
//     write!(f, "{{'{}': {}}}", "symbol", self.symbol)
//   }
// }

impl JsonCellColumn {
  pub fn new(index: usize) -> JsonCellColumn {
    JsonCellColumn {
      symbol: SYMBOLS[index],
      strike_out: false,
      highlight: false
    }
  }
}
