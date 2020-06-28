// Split the rows into the squared number of rows given e.g.:
//
// rows: [                          split_rows: [
//   [1, 2, 3,  4,  5, 6],      ->    [ 1,  2,  3],
//   [7, 8, 9, 10, 11, 12]            [ 4,  5,  6],
// ]                                  [ 7,  8,  9],
//                                    [10, 11, 12]
//                                  ]
function squareRows(rows) {
  const splitRows = [];
  const segments = rows[0].length / rows.length;

  rows.forEach(row => {
    let offset = 0;
    for (let index = 0; index < rows.length; index++) {
      splitRows.push(row.slice(offset, offset + segments));
      offset += segments;
    }
  });

  return splitRows;
}

// Re-combine rows at alternating root columns
//
// split_rows: [                    combined_rows: [
//   [ 1,  2,  3],      ->            [1, 2, 3,  7,  8,  9],
//   [ 4,  5,  6],                    [4, 5, 6, 10, 11, 12]
//   [ 7,  8,  9],                  ]
//   [10, 11, 12]
// ]
function combineRows(rows) {
  const result = [];
  const root = Math.sqrt(rows.length) >>> 0;

  for (let i = 0; i < root; i++) {
    let index = i;
    const combine = [];
    for (let j = 0; j < root; j++) {
      combine.push(...rows[index]);
      index += root;
    }
    result.push(combine);
  }

  return result;
}

// Transpose sub grids into rows
//
// rows: [                      transposed_rows: [
//   [ 1,  2,  3,  4]             [ 1,  2,  5,  6],
//   [ 5,  6,  7,  8]      ->     [ 3,  4,  7,  8],
//   [ 9, 10, 11, 12]             [ 9, 10, 13, 14],
//   [13, 14, 15, 16]             [11, 12, 15, 16]
// ]                            ]
export function transposeRows(columns, rows) {
  const transposed = [];
  let segments = rows.length / columns;
  let size = rows.length / segments;

  for (let index = 0; index < segments; index++) {
    let from = index * size;
    transposed.push(combineRows(squareRows(rows.slice(from, from + size))));
  }

  return transposed;
}

export function groupBy(input, n) {
  const groups = [];
  for (let index = 0; index < n ** 2; index += n) {
    groups.push(input.slice(index, index + n));
  }
  
  return groups;
}