use super::json_cell_row::JsonCellRow;
use super::dimensions::Dimensions;

#[derive(Debug)]
pub struct JsonCell {
  rows: Vec<JsonCellRow>,
  // symbol: String,
  // set_method: SetMethod
}

impl JsonCell {
  pub fn new(dimensions: &Dimensions) -> JsonCell {
    let mut json_rows: Vec<JsonCellRow> = Vec::with_capacity(dimensions.rows);

    for row in 0..dimensions.rows {
      json_rows.push(JsonCellRow::new(dimensions.columns, row));
    }

    JsonCell {
      rows: json_rows,
      // symbol: String,
      // set_method: SetMethod::Unset
    }
  }

  pub fn print(&mut self) {
      println!("JsonCell {:#?}", self);
  }
}