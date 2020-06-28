#[derive(Debug)]
pub struct Dimensions {
  pub columns: usize,
  pub rows: usize,
  pub total: usize,
  swopped: Option<Box<Self>>
}

impl Dimensions {
  pub fn new(columns: usize, rows: usize) -> Self {
    let total = columns * rows;
    Self {
      columns,
      rows,
      total,
      swopped: Some(Box::new(Self {
        columns: rows,                                              // columns and rows swopped
        rows: columns,
        total,
        swopped: Some(Box::new(Self {
          columns,
          rows,
          total,
          swopped: None,
        })),
      })),
    }
  }

  pub fn swop(&self) -> &Self {
    self.swopped.as_ref().unwrap()
  }
}
