extern crate solver;

use solver::solve;

fn main() {
  let input = vec![1, 15, 8, 15, 15, 2, 15, 15, 15, 15, 4, 15, 15, 15, 15, 8];
  let output = solve(2, 2, input);

  println!("OUTPUT: {:?}", output);
}
