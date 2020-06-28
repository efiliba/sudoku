extern crate solver;

use solver::solve;

fn main() {
  // let input = vec![1, 15, 8, 15, 15, 2, 15, 15, 15, 15, 4, 15, 15, 15, 15, 8];
  // let input = vec![11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 44];
  let input = vec![
    11, 12, 13, 14, 15, 16,
    21, 22, 23, 24, 25, 26,
    31, 32, 33, 34, 35, 36,
    41, 42, 43, 44, 45, 46,
    51, 52, 53, 54, 55, 56,
    61, 62, 63, 64, 65, 66,
  ];
  let output = solve(3, 2, input);

  println!("OUTPUT: {:?}", output);
}
