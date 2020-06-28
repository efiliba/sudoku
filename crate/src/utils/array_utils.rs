// Split the rows into the squared number of rows given e.g.:
//
// rows: [                          split_rows: [
//   [1, 2, 3,  4,  5, 6],      ->    [ 1,  2,  3],
//   [7, 8, 9, 10, 11, 12]            [ 4,  5,  6],
// ]                                  [ 7,  8,  9],
//                                    [10, 11, 12]
//                                  ]
pub fn square_rows(rows: &[Vec<usize>]) -> Vec<&[usize]> {
  let total_rows = rows.len();
  let segments = if total_rows > 0 { rows[0].len() / total_rows } else { 0 };
  let mut split_rows: Vec<&[usize]> = Vec::with_capacity(segments * segments);

  for row in rows.iter() {
    let mut offset = 0;
    for _ in 0..total_rows {
      split_rows.push(&row[offset..offset + segments]);
      offset += segments;
    }
  }

  split_rows
}

// Re-combine rows at alternating root columns
//
// split_rows: [                    combined_rows: [
//   [ 1,  2,  3],      ->            [1, 2, 3,  7,  8,  9],
//   [ 4,  5,  6],                    [4, 5, 6, 10, 11, 12]
//   [ 7,  8,  9],                  ]
//   [10, 11, 12]
// ]
pub fn combine_rows(rows: &Vec<&[usize]>) -> Vec<Vec<usize>> {
  let root = (rows.len() as f64).sqrt() as usize;
  let mut result = Vec::with_capacity(root);

  for i in 0..root {
    let mut index = i;
    let mut combine = Vec::with_capacity(root);
    for _ in 0..root {
      combine.extend_from_slice(&rows[index]);
      index += root;
    }
    result.push(combine);
  }

  result
}

// Transpose sub grids into rows
//
// rows: [                      transposed_rows: [
//   [ 1,  2,  3,  4]             [ 1,  2,  5,  6],
//   [ 5,  6,  7,  8]      ->     [ 3,  4,  7,  8],
//   [ 9, 10, 11, 12]             [ 9, 10, 13, 14],
//   [13, 14, 15, 16]             [11, 12, 15, 16]
// ]                            ]
pub fn transpose_rows(columns: usize, rows: &Vec<Vec<usize>>) -> Vec<Vec<usize>> {
  let segments = rows.len() / columns;
  let size = rows.len() / segments;
  let mut transposed: Vec<Vec<usize>> = Vec::with_capacity(rows.len());

  for index in 0..segments {
    let from = index * size;
    transposed.extend(combine_rows(&square_rows(&rows[from..from + size])));
  }

  transposed
}
