#[cfg(test)]
mod cell {
  use crate::cell::{cell::Cell, dimensions::Dimensions};

  #[test]
  fn it_contains_option_at_position() {
    let dimensions = &Dimensions::new(4, 2);
    let cell = Cell::new(dimensions, 0, 0);                         //  1 |  2 |  4 |  8      1 | 2 | 3 | 4
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
}

#[cfg(test)]
mod symbol {
  use crate::cell::{SYMBOLS, cell::Cell, dimensions::Dimensions, SetMethod};

  #[test]
  fn it_sets_by_option_1() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_option(1, SetMethod::User);
    assert_eq!(cell.symbol(), '1');
  }

  #[test]
  fn it_sets_by_option_2() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_option(2, SetMethod::User);                         // 1 << 1 = 2
    assert_eq!(cell.symbol(), '2');
  }

  #[test]
  fn it_sets_by_option_a() {
    let dimensions = &Dimensions::new(4, 4);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_option(1 << 9, SetMethod::User);
    assert_eq!(cell.symbol(), 'A');
  }

  #[test]
  fn it_sets_by_option_v() {
    let dimensions = &Dimensions::new(6, 6);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_option(1 << 30, SetMethod::User);
    assert_eq!(cell.symbol(), 'V');
  }

  #[test]
  fn it_sets_by_option_0() {
    let dimensions = &Dimensions::new(6, 6);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_option(1 << 35, SetMethod::User);
    assert_eq!(cell.symbol(), '0');
  }

  #[test]
  fn it_sets_by_position_4_5() {
    let dimensions = &Dimensions::new(6, 6);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_position(4, 5, SetMethod::User);
    assert_eq!(cell.symbol(), 'Z');
  }

  #[test]
  fn it_sets_by_position_5_5() {                                        // Max symbol
    let dimensions = &Dimensions::new(6, 6);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_position(5, 5, SetMethod::User);
    assert_eq!(cell.symbol(), '0');
  }

  #[test]
  fn it_set_by_symbol_3_and_is_solved() {
    let dimensions = &Dimensions::new(2, 2);
    let mut cell = Cell::new(dimensions, 0, 0); 

    cell.set_by_symbol('3', SetMethod::User);
    assert_eq!(cell.symbol(), '3');
    assert!(cell.solved());
    assert_eq!(cell.set_method, SetMethod::User);
  }

  #[test]
  fn it_set_by_all_symbols() {
    let dimensions = &Dimensions::new(6, 6);
    let mut cell = Cell::new(dimensions, 0, 0); 

    SYMBOLS.iter().enumerate().for_each(|(i, x)| {
      cell.set_by_symbol(*x, SetMethod::User);
      assert_eq!(cell.symbol(), SYMBOLS[i]);
    });
  }
}

#[cfg(test)]
mod cell_3x3 {
  use crate::cell::{cell::Cell, dimensions::Dimensions, SetMethod};

  #[test]
  fn it_sets_cell_with_no_modifications() {
    let dimensions = &Dimensions::new(3, 3);
    let cell = Cell::new(dimensions, 0, 0);

    assert_eq!(cell.options, usize::pow(2, 9) - 1);                 // All options available i.e. 511
    assert_eq!(cell.total_options_remaining, dimensions.total);     // 3 * 3
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
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

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
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

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
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.set_by_position(0, 2, SetMethod::User);
    cell.reset();

    assert_eq!(cell.options, usize::pow(2, 3 * 3) - 1);             // All options available i.e. 511
    assert_eq!(cell.total_options_remaining, 3 * 3);
    assert_eq!(cell.solved(), false);
    assert_eq!(cell.set_method, SetMethod::Unset);
  }

  #[test]
  fn it_removes_bit_16() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    assert_eq!(cell.remove_option_at_position(1, 1), false);        // Remove option bit = 16 -> not last option
    assert_eq!(cell.total_options_remaining, 8);

  //       expect(cell.json).toEqual({
  //         rows:
  //         [
  //           { columns: [{ symbol: '1' }, { symbol: '2' }, { symbol: '3' }] },
  //           { columns: [{ symbol: '4' }, { symbol: '5', strikeOut: true }, { symbol: '6' }] },
  //           { columns: [{ symbol: '7' }, { symbol: '8' }, { symbol: '9' }] }
  //         ]
  //       });
  }

  #[test]
  fn it_already_has_bit_16_removed() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous test

    assert_eq!(cell.remove_option(16), false);
    assert_eq!(cell.total_options_remaining, 8);
  }

  #[test]
  fn it_removes_bits_1_2_4() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

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
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.options, 488);                                  // 488 = 000 101 111
    assert_eq!(cell.contains_option(2), false);
    assert_eq!(cell.remove_option_at_position(1, 0), false);        // 2 already removed
    assert_eq!(cell.total_options_remaining, 5);
  }
  
  #[test]
  fn it_removes_options_per_row() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.removed_options_per_row(0), [0, 1, 2]);         // 0 0 0    - all removed from row 0
    assert_eq!(cell.removed_options_per_row(1), [1]);               // 1 0 1    - only 2nd option removed
    assert_eq!(cell.removed_options_per_row(2), []);                // 1 1 1    - no options removed
  }

  #[test]
  fn it_does_not_remove_options() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.remove_options(488), false);                    // Attempt to remove all
    assert_eq!(cell.remove_options(511), false);
    assert_eq!(cell.total_options_remaining, 5);                    // Nothing removed
  }

  #[test]
  fn it_removes_bottom_row() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);

    assert_eq!(cell.remove_options(64 + 128 + 256), false);         // Remove bottom row
    assert_eq!(cell.removed_options_per_row(2), [0, 1, 2]);         // All removed

  //       expect(cell.json).toEqual({
  //         rows:
  //         [
  //           { columns: [{ symbol: '1', strikeOut: true }, { symbol: '2', strikeOut: true }, { symbol: '3', strikeOut: true }] },
  //           { columns: [{ symbol: '4' }, { symbol: '5', strikeOut: true }, { symbol: '6' }] },
  //           { columns: [{ symbol: '7', strikeOut: true }, { symbol: '8', strikeOut: true }, { symbol: '9', strikeOut: true }] }
  //         ]
  //       });
  
    assert_eq!(cell.total_options_remaining, 2);
    assert_eq!(cell.solved(), false);
    assert_eq!(cell.set_method, SetMethod::Unset);
  }

  #[test]
  fn it_removes_bit_32_leaving_bit_8() {
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

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
    let dimensions = &Dimensions::new(3, 3);
    let mut cell = Cell::new(dimensions, 0, 0);

    cell.remove_option_at_position(1, 1);                           // Continue from previous tests
    cell.remove_options(7);
    cell.remove_options(64 + 128 + 256);
    cell.remove_options(1 + 2 + 4 + 32);

    assert!(cell.solved());
    assert_eq!(cell.set_method, SetMethod::Calculated);
  }
}


//   describe("Json", () => {
//     let cell: ICell;

//     beforeEach(() => {
//       Cell.Constructor(2, 2);
//       cell = new Cell(0, 0);
//     });

//     describe("Get", () => {
//       it("should contain all symbols", () => {
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1" }, { "symbol": "2" }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4" }] }] });
//       });

//       it("should have symbol 1 stuck out", () => {
//         cell.removeOption(1);
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": true }, { "symbol": "2" }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4" }] }] });
//       });

//       it("should be set directly", () => {
//         cell.json.rows[0].columns[0].strikeOut = false;
//         cell.json.rows[0].columns[1].strikeOut = true;
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": false }, { "symbol": "2", "strikeOut": true }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4" }] }] });
//       });

//       it("should be set by reference", () => {
//         const json: IJsonCell = cell.json;
//         cell.removeOption(1);
//         json.rows[0].columns[1].strikeOut = true;
//         json.rows[1].columns[0].strikeOut = false;
//         json.rows[1].columns[1].strikeOut = false;

//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": true }, { "symbol": "2", "strikeOut": true }] }, { "columns": [{ "symbol": "3", "strikeOut": false }, { "symbol": "4", "strikeOut": false }] }] });
//       });

//       it("should be set to a symbol", () => {
//         cell.setByOption(1, SetMethod.user);
//         expect(cell.json).toEqual({ "symbol": "1", "setMethod": SetMethod.user });
//       });

//       it("should have options removed", () => {
//         cell.removeOptions(3);
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": true }, { "symbol": "2", "strikeOut": true }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4" }] }] });
//       });

//       it("should have options removed leaving symbol", () => {
//         cell.removeOptions(7);
//         expect(cell.json).toEqual({ "symbol": "4" });
//       });
//     });

//     describe("Set", () => {
//       it("should be set to default", () => {
//         cell.setJson({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": false }, { "symbol": "2" }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4", "strikeOut": false }] }] });
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": false }, { "symbol": "2" }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4", "strikeOut": false }] }] });

//         expect(cell.options).toBe(15);
//         expect(cell.containsOptionAtPosition(0, 0)).toBe(true);
//         expect(cell.containsOptionAtPosition(1, 0)).toBe(true);
//         expect(cell.containsOptionAtPosition(0, 1)).toBe(true);
//         expect(cell.containsOptionAtPosition(1, 1)).toBe(true);
//         expect(cell.totalOptionsRemaining).toBe(4);
//         expect(cell.setMethod).toBeNull();
//       });

//       it("should have struck out options", () => {
//         cell.setJson({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": true }, { "symbol": "2", "strikeOut": false }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4", "strikeOut": true }] }] });
//         expect(cell.json).toEqual({ "rows": [{ "columns": [{ "symbol": "1", "strikeOut": true }, { "symbol": "2", "strikeOut": false }] }, { "columns": [{ "symbol": "3" }, { "symbol": "4", "strikeOut": true }] }] });

//         expect(cell.options).toBe(15 - 1 - 8);
//         expect(cell.containsOptionAtPosition(0, 0)).toBe(false);
//         expect(cell.containsOptionAtPosition(1, 0)).toBe(true);
//         expect(cell.containsOptionAtPosition(0, 1)).toBe(true);
//         expect(cell.containsOptionAtPosition(1, 1)).toBe(false);
//         expect(cell.totalOptionsRemaining).toBe(2);
//         expect(cell.setMethod).toBeNull();
//       });

//       it("should be a symbol only", () => {
//         cell.setJson({ "symbol": "1" });
//         expect(cell.json).toEqual({ "symbol": "1" });
//       });

//       it("should be set by option to a symbol", () => {
//         cell.setByOption(1, SetMethod.user);
//         expect(cell.json).toEqual({ "symbol": "1", "setMethod": SetMethod.user });
//       });

//       it("should be set by position to a symbol", () => {
//         cell.setByPosition(1, 1, SetMethod.user);
//         expect(cell.json).toEqual({ "symbol": "4", "setMethod": SetMethod.user });
//       });

//       it("should be set by symbol to a symbol", () => {
//         cell.setBySymbol("3", SetMethod.user);
//         expect(cell.json).toEqual({ "symbol": "3", "setMethod": SetMethod.user });
//       });

//       it("should be fixed by option to a symbol", () => {
//         cell.setByOption(1, SetMethod.loaded);
//         expect(cell.json).toEqual({ "symbol": "1", "setMethod": SetMethod.loaded });
//       });

//       it("should be fixed by position to a symbol", () => {
//         cell.setByPosition(1, 1, SetMethod.loaded);
//         expect(cell.json).toEqual({ "symbol": "4", "setMethod": SetMethod.loaded });
//       });

//       it("should be fixed by symbol to a symbol", () => {
//         cell.setBySymbol("3", SetMethod.loaded);
//         expect(cell.json).toEqual({ "symbol": "3", "setMethod": SetMethod.loaded });
//       });
//     });

//     describe("Deep copy", () => {
//       let copy: ICell;

//       it("should be equal as unmodified", () => {
//         copy = new Cell(cell);
//         expect(copy.json).toEqual(cell.json);
//       });

//       it("should not be equal as only one modified", () => {
//         cell.json.rows[0].columns[0].symbol = 'x';
//         expect(copy.json).not.toEqual(cell.json);
//       });

//       xit("should be equal as both modified", () => {
//         copy = new Cell(cell);

//         copy.json.rows[0].columns[0].symbol = 'x';
//         expect(copy.json).toEqual(cell.json);
//       });
//     });
//   });

