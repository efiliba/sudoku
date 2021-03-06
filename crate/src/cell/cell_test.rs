#[cfg(test)]
mod cell {
  use crate::cell::{cell::Cell, SetMethod};

  #[test]
  fn it_contains_option_at_position() {
    let max_columns = 4;
    let max_rows = 2;
    let cell = Cell::new(max_columns, max_rows, 0, 0);              //  1 |  2 |  4 |  8      1 | 2 | 3 | 4
    assert_eq!(cell.options, 255);                                  // ------------------  =  --------------
                                                                    // 16 | 32 | 64 | 128     5 | 6 | 7 | 8
    assert!(cell.contains_option_at_position(0, 0));
    assert!(cell.contains_option_at_position(1, 0));
    assert!(cell.contains_option_at_position(2, 0));
    assert!(cell.contains_option_at_position(3, 0));
    assert!(cell.contains_option_at_position(0, 1));
    assert!(cell.contains_option_at_position(1, 1));
    assert!(cell.contains_option_at_position(2, 1));
    assert!(cell.contains_option_at_position(3, 1));
    assert_eq!(cell.contains_option_at_position(4, 1), false);      // No bit set - overflow
    assert_eq!(cell.contains_option_at_position(0, 2), false);
  }

  #[test]
  fn it_can_remove_an_option() {
    let max_columns = 2;
    let max_rows = 1;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    let only_option_left = cell.remove_option(1);                   // Remove option 1, leaving option 2 (only)

    assert!(only_option_left);
    assert_eq!(cell.total_options_remaining, 1);
    assert_eq!(cell.set_method, SetMethod::Calculated);
    assert_eq!(cell.options, 2);                                    // Remaining options
  }
}

#[cfg(test)]
mod symbol {
  use crate::cell::{SYMBOLS, cell::Cell, SetMethod};

  #[test]
  fn it_sets_by_option_1() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_option(1, SetMethod::User);
    assert_eq!(cell.symbol(), '1');
  }

  #[test]
  fn it_sets_by_option_2() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_option(2, SetMethod::User);                         // 1 << 1 = 2
    assert_eq!(cell.symbol(), '2');
  }

  #[test]
  fn it_sets_by_option_a() {
    let max_columns = 4;
    let max_rows = 4;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_option(1 << 9, SetMethod::User);
    assert_eq!(cell.symbol(), 'A');
  }

  #[test]
  fn it_sets_by_option_v() {
    let max_columns = 6;
    let max_rows = 6;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_option(1 << 30, SetMethod::User);
    assert_eq!(cell.symbol(), 'V');
  }

  #[test]
  fn it_sets_by_option_0() {
    let max_columns = 6;
    let max_rows = 6;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_option(1 << 35, SetMethod::User);
    assert_eq!(cell.symbol(), '0');
  }

  #[test]
  fn it_sets_by_position_4_5() {
    let max_columns = 6;
    let max_rows = 6;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_position(4, 5, SetMethod::User);
    assert_eq!(cell.symbol(), 'Z');
  }

  #[test]
  fn it_sets_by_position_5_5() {                                    // Max symbol
    let max_columns = 6;
    let max_rows = 6;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_position(5, 5, SetMethod::User);
    assert_eq!(cell.symbol(), '0');
  }

  #[test]
  fn it_set_by_symbol_3_and_is_solved() {
    let max_columns = 2;
    let max_rows = 2;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    cell.set_by_symbol('3', SetMethod::User);
    assert_eq!(cell.symbol(), '3');
    assert!(cell.solved());
    assert_eq!(cell.set_method, SetMethod::User);
  }

  #[test]
  fn it_set_by_all_symbols() {
    let max_columns = 6;
    let max_rows = 6;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0); 

    SYMBOLS.iter().enumerate().for_each(|(i, x)| {
      cell.set_by_symbol(*x, SetMethod::User);
      assert_eq!(cell.symbol(), SYMBOLS[i]);
    });
  }
}

#[cfg(test)]
mod cell_3x3 {
  use crate::cell::{cell::Cell, SetMethod};

  #[test]
  fn it_sets_cell_with_no_modifications() {
    let max_columns = 3;
    let max_rows = 3;
    let cell = Cell::new(max_columns, max_rows, 0, 0);

    assert_eq!(cell.options, u64::pow(2, 9) - 1);                   // All options available i.e. 511
    assert_eq!(cell.total_options_remaining, max_columns * max_rows);
    assert_eq!(cell.solved(), false);                               // Not solved
    assert_eq!(cell.set_method, SetMethod::Unset);

    assert!(cell.contains_option_at_position(0, 0));                // Contains option at (0, 0)
    assert_eq!(cell.contains_option(0), false);                     // Does not contain option 0 -> only 1..9 valid
    assert!(cell.contains_option(1));                               // Contains option 1
    assert!(cell.contains_option(3));                               // Contain either option 1 or 2
    assert!(cell.contains_options(3));                              // Contain both options 1 and 2
  }

  #[test]
  fn it_sets_cell_by_position_0_2() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.set_by_position(0, 2, SetMethod::User);                    // Set cell to column 0 row 2 i.e. symbol 7, bit 64
    assert_eq!(cell.total_options_remaining, 1);
    assert_eq!(cell.symbol(), '7');
    assert!(cell.solved());
    assert_eq!(cell.set_method, SetMethod::User);

    assert_eq!(cell.contains_option_at_position(0, 0), false);
    assert!(cell.contains_option_at_position(0, 2));
    assert_eq!(cell.contains_option(0), false);
    assert_eq!(cell.contains_option(32), false);
    assert!(cell.contains_option(64));
    assert!(cell.contains_option(65));                              // bit 1 or 64
    assert!(cell.contains_options(64));
    assert_eq!(cell.contains_options(65), false);                   // bit 1 and 64
  }

  #[test]
  fn it_sets_cell_by_option_4() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.set_by_option(4, SetMethod::User);                          // Set cell to options 4 i.e. highest of bits 1 and 4
    assert_eq!(cell.total_options_remaining, 1);
    assert_eq!(cell.symbol(), '3');
    assert!(cell.solved());                                         // Only 1 bit set
    assert_eq!(cell.set_method, SetMethod::User);

    assert_eq!(cell.contains_option_at_position(0, 0), false);      // Only contains bit 4
    assert!(cell.contains_option_at_position(2, 0));
    assert_eq!(cell.contains_option_at_position(0, 2), false);
    assert_eq!(cell.contains_option(0), false);
    assert_eq!(cell.contains_option(32), false);
    assert_eq!(cell.contains_option(1), false);
    assert!(cell.contains_option(4));
    assert!(cell.contains_option(5));                               // bit 1 or 4
    assert!(cell.contains_option(7));                               // 1, 2 or 4
    assert_eq!(cell.contains_options(5), false);
    assert!(cell.contains_options(4));
    assert_eq!(cell.contains_options(7), false);                    // bit 1, 2 and 4
  }

  #[test]
  fn it_resets_the_cell() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.set_by_position(0, 2, SetMethod::User);
    cell.reset();

    assert_eq!(cell.options, u64::pow(2, 3 * 3) - 1);               // All options available i.e. 511
    assert_eq!(cell.total_options_remaining, 3 * 3);
    assert_eq!(cell.solved(), false);
    assert_eq!(cell.set_method, SetMethod::Unset);
  }

  #[test]
  fn it_removes_bit_16() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    assert_eq!(cell.remove_option_at_position(1, 1), false);        // Remove option bit = 16 -> not last option
    assert_eq!(cell.total_options_remaining, 8);
  }

  #[test]
  fn it_already_has_bit_16_removed() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous test

    assert_eq!(cell.remove_option(16), false);
    assert_eq!(cell.total_options_remaining, 8);
  }

  #[test]
  fn it_removes_bits_1_2_4() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests

    assert_eq!(cell.remove_options(7), false);                      // Removed 4, 2 and 1
    assert_eq!(cell.total_options_remaining, 5);

  //       expect(cell.json).toEqual({
  //         rows:
  //         [
  //           { columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }, { symbol: '3', strikeOut: true }] },
  //           { columns: [{ symbol: '4' }, { symbol: '5', strikeOut: true }, { symbol: '6' }] },
  //           { columns: [{ symbol: '7' }, { symbol: '8' }, { symbol: '9' }] }
  //         ]
  //       });
  }

  #[test]
  fn it_does_not_contain_bit_2() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.options, 488);                                  // 488 = 000 101 111
    assert_eq!(cell.contains_option(2), false);
    assert_eq!(cell.remove_option_at_position(1, 0), false);        // 2 already removed
    assert_eq!(cell.total_options_remaining, 5);
  }
  
  #[test]
  fn it_removes_options_per_row() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.removed_options_per_row(0), [0, 1, 2]);         // 0 0 0    - all removed from row 0
    assert_eq!(cell.removed_options_per_row(1), [1]);               // 1 0 1    - only 2nd option removed
    assert_eq!(cell.removed_options_per_row(2), []);                // 1 1 1    - no options removed
  }

  #[test]
  fn it_does_not_remove_options() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.remove_options(488), false);                    // Attempt to remove all
    assert_eq!(cell.remove_options(511), false);
    assert_eq!(cell.total_options_remaining, 5);                    // Nothing removed
  }

  #[test]
  fn it_removes_bottom_row() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.remove_options(64 + 128 + 256), false);         // Remove bottom row
    assert_eq!(cell.removed_options_per_row(2), [0, 1, 2]);         // All removed
  
    assert_eq!(cell.total_options_remaining, 2);
    assert_eq!(cell.solved(), false);
    assert_eq!(cell.set_method, SetMethod::Unset);
  }

  #[test]
  fn it_removes_bit_32_leaving_bit_8() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);
    cell.remove_options(64 + 128 + 256);

    assert!(cell.remove_options(1 + 2 + 4 + 32));                    // Only 32 removed leaving 8 - RETURNS last remaining
    assert_eq!(cell.removed_options_per_row(1), [1, 2]);            // Only first bit in row left
  //       assert_eq!(cell.json).toEqual({ symbol: '4' });

    assert_eq!(cell.total_options_remaining, 1);
    assert!(cell.contains_option_at_position(0, 1));
    assert!(cell.contains_option(8));
    assert_eq!(cell.symbol(), '4');
  }

  #[test]
  fn it_is_solved() {
    let max_columns = 3;
    let max_rows = 3;
    let mut cell = Cell::new(max_columns, max_rows, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);
    cell.remove_options(64 + 128 + 256);
    cell.remove_options(1 + 2 + 4 + 32);

    assert!(cell.solved());
    assert_eq!(cell.set_method, SetMethod::Calculated);
  }
}
