#[cfg(test)]
mod select {
  use crate::utils::combinations::Combinations;

  #[test]
  fn it_returns_c_4_1_is_4() {
    let combinations = Combinations::new(4);                        // columns * rows
    let from = ['a', 'b', 'c', 'd'].to_vec();
    let pick = 1;
    let actual = combinations.select(&from, pick);

    println!("{:?}", actual);
    // assert!(false);
    let expected = vec![
      vec![&'a'],
      vec![&'b'],
      vec![&'c'],
      vec![&'d']
    ];

    assert_eq!(expected, actual);
  }

  #[test]
  fn it_returns_c_4_2_is_6() {                                      // C(4, 2) = 4 * 3 / 2 = 6
    let combinations = Combinations::new(4);
    let from = vec![1, 2, 3, 4];
    let pick = 2;
    let actual = combinations.select(&from, pick);

    let expected = vec![
      vec![&1, &2],
      vec![&1, &3],
      vec![&2, &3],
      vec![&1, &4],
      vec![&2, &4],
      vec![&3, &4]
    ];

    assert_eq!(expected, actual);
  }

  #[test]
  fn it_returns_c_4_3_is_4() {
    let combinations = Combinations::new(4);
    let from = ['a', 'b', 'c', 'd'].to_vec();
    let pick = 3;
    let actual = combinations.select::<char>(&from, pick);

    let expected = vec![
      vec![&'a', &'b', &'c'],
      vec![&'a', &'b', &'d'],
      vec![&'a', &'c', &'d'],
      vec![&'b', &'c', &'d']
    ];

    assert_eq!(expected, actual);
  }

  #[test]
  fn it_returns_c_4_4_is_1() {
    let combinations = Combinations::new(4);
    let from = ['a', 'b', 'c', 'd'].to_vec();
    let pick = 4;
    let actual = combinations.select::<char>(&from, pick);

    let expected = vec![vec![&'a', &'b', &'c', &'d']];

    assert_eq!(expected, actual);
  }
}
