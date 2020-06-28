use super::json_cell_column::JsonCellColumn;

#[derive(Debug)]
pub struct JsonCellRow {
  pub columns: Vec<JsonCellColumn>
}

impl JsonCellRow {
  pub fn new(columns: usize, row: usize) -> JsonCellRow {
    let mut json_columns: Vec<JsonCellColumn> = Vec::with_capacity(columns);

    for column in 0..columns {
      json_columns.push(JsonCellColumn::new(row * columns + column));
    }

    JsonCellRow {
      columns: json_columns
    }
  }
}