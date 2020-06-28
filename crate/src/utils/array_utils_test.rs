#[cfg(test)]
fn compare(actual: Vec<Vec<u64>>, expected: Vec<Vec<u64>>) -> bool {
  let equal = actual.len() == expected.len();
  let mut index = 0;
  let mut iterator = expected.iter();

  while let Some(item) = iterator.next() {
    if actual[index] != &item[..] {
      println!("Actual {:?} does not equal expected {:?}, at index: {}", actual[index], item, index);
      return false;
    }
    index += 1;
  }

  equal
}

#[cfg(test)]
mod array_utils {
  use crate::utils::array_utils::{square_rows, combine_rows, transpose_rows};

  #[test]
  fn it_splits_rows_into_square_rows() {
    let rows = vec![
      vec![1, 2, 3, 4, 5, 6],
      vec![7, 8, 9, 10, 11, 12],
      vec![13, 14, 15, 16, 17, 18]
    ];

    let expected = vec![
      vec![1, 2],
      vec![3, 4],
      vec![5, 6],
      vec![7, 8],
      vec![9, 10],
      vec![11, 12],
      vec![13, 14],
      vec![15, 16],
      vec![17, 18]
    ];

    let actual: Vec<&[u64]> = square_rows(&rows);

    assert!(super::compare(actual.iter().map(|x| x.to_vec()).collect(), expected));
  }

  #[test]
  fn it_re_combines_rows_at_alternating_root() {
    let rows: Vec<&[u64]> = vec![
      &[1, 2],
      &[3, 4],
      &[5, 6],
      &[7, 8],
      &[9, 10],
      &[11, 12],
      &[13, 14],
      &[15, 16],
      &[17, 18]
    ];

    let expected = vec![
      vec![1, 2, 7, 8, 13, 14],
      vec![3, 4, 9, 10, 15, 16],
      vec![5, 6, 11, 12, 17, 18]
    ];

    let actual = combine_rows(&rows);

    assert!(super::compare(actual, expected));
  }

  #[test]
  fn it_transposes_rows_along_diagonal() {
    //        |       ||       |       |              |       ||       |       |
    //    1   |   2   ||   3   |   4   |          1   |   2   ||   4   |   8   |
    //        |       ||       |       |              |       ||       |       |
    //  --------------||----------------        --------------||----------------
    //    |   |   |   || 1 | 2 | 1 | 2 |              |       ||       |       |
    //  ----- | ----- || ----- | ----- |         12   |  12   ||   3   |   3   |
    //  3 | 4 | 3 | 4 ||   |   |   |   |              |       ||       |       |
    //  ================================    =   --------------||----------------
    //    | 2 | 1 |   || 1 | 2 | 1 | 2 |              |       ||       |       |
    //  ----- | ----- || ----- | ----- |         14   |  13   ||  11   |   7   |
    //  3 | 4 | 3 | 4 ||   | 4 | 3 |   |              |       ||       |       |
    //  --------------||----------------        --------------||----------------
    //    | 2 | 1 |   || 1 | 2 | 1 | 2 |              |       ||       |       |
    //  ----- | ----- || ----- | ----- |         14   |  13   ||  11   |   7   |
    //  3 | 4 | 3 | 4 ||   | 4 | 3 |   |              |       ||       |       |
    let rows = vec![
      vec![ 1,  2, 12, 12],                                         // top left sub grid
      vec![ 4,  8,  3,  3],
      vec![14, 13, 14, 13],
      vec![11,  7, 11,  7]
    ];

    let actual = transpose_rows(2, &rows);

    let expected = vec![
      vec![ 1,  2,  4,  8],                                         // transposed top row
      vec![12, 12,  3,  3],
      vec![14, 13, 11,  7],
      vec![14, 13, 11,  7]
    ];

    assert!(super::compare(actual, expected));
  }
}
