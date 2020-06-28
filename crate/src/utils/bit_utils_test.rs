#[cfg(test)]
mod number_of_bits_set {
  use crate::utils::bit_utils::number_of_bits_set;

  #[test]
  fn it_returns_number_of_bits_set() {
    assert_eq!(number_of_bits_set(333), 5);                          // Population count i.e. 333 = 101001101 i.e. 5 bits set
    assert_eq!(number_of_bits_set(0b101001101), 5);
  }
}

#[cfg(test)]
mod set_bits {
  use crate::utils::bit_utils::bitwise_or;

  #[test]
  fn it_should_have_all_bits_set() {
    let elements = [1, 2, 4, 8];                                    // 0001 | 0010 | 0100 | 1000 = 1111
    assert_eq!(bitwise_or(&elements), 15);
  }

  #[test]
  fn it_should_have_duplicate_bits_set_only_once() {
    let elements = [1, 2, 3];                                        // 01 | 10 | 11  = 11
    assert_eq!(bitwise_or(&elements), 3);
  }

  #[test]
  fn it_should_only_have_bits_set_if_any_item_contains_that_bit() {
    let elements = [2, 6, 12];                                      // 0010 | 0110 | 1100 = 1110
    assert_eq!(bitwise_or(&elements), 14);
  }
}

#[cfg(test)]
mod only_option {
  use crate::utils::bit_utils::only_option;

  #[test]
  fn it_should_not_have_any_bits_set() {
    let xor_bits = [1, 2, 3];                                       // 01 ^ 10 ^ 11  = 00
    assert_eq!(only_option(&xor_bits), (false, 3));
  }

  #[test]
  fn it_should_have_all_bits_set() {
    let xor_bits = [1, 2, 4, 8];                                     // 0001 ^ 0010 ^ 0100 ^ 1000 = 1111
    assert_eq!(only_option(&xor_bits), (false, 0));                 // All bits set i.e. singulare bit required
  }

  #[test]
  fn it_should_have_option_found_at_bit_2() {
    let xor_bits = [5, 6, 9, 12];                                   // 0101 ^ 0110 ^ 1001 ^ 1100 = 0010
    assert_eq!(only_option(&xor_bits), (true, 2));
  }

  #[test]
  fn it_should_not_have_a_singular_option_set() {
    let xor_bits = [3, 6, 12];                                      // 0011 ^ 0110 ^ 1100 = 1001
    assert_eq!(only_option(&xor_bits), (false, 9));
  }

  #[test]
  fn it_should_only_have_bit_8_set() {
    let xor_bits = [3, 7, 12];                                       // 0011 ^ 0111 ^ 1100 = 1000
    assert_eq!(only_option(&xor_bits), (true, 8));
  }
}

#[cfg(test)]
mod first_index_of_item_in_array_containing_bit {
  use crate::utils::bit_utils::containing_bit_index;

  #[test]
  fn it_should_have_bit_1_set_at_index_2() {
    let array = [0, 2, 3, 4];                                       // 000, 010, 011, 100 
    assert_eq!(containing_bit_index(&array, 1), 2);                 // Index of first item that has bit 1 set - only item 3 has bit 1 set
  }

  #[test]
  fn it_should_have_bit_2_set_at_index_1() {
    let array = [0, 2, 3, 4];
    assert_eq!(containing_bit_index(&array, 2), 1);                  // Index of first item that has bit 2 set
  }

  #[test]
  fn it_should_have_bit_4_set_at_index_3() {
    let array = [0, 2, 3, 4];
    assert_eq!(containing_bit_index(&array, 4), 3);                 // Index of first item that has bit 4 set
  }

  #[test]
  fn it_should_have_index_out_of_range() {
    let array = [0, 2, 3, 4];
    assert_eq!(containing_bit_index(&array, 8), array.len());        // Bit 8 not set => index out of range
  }

  #[test]
  fn it_should_not_have_bit_0_found_ie_out_of_range() {
    let array = [0, 2, 3, 4];
    assert_eq!(containing_bit_index(&array, 0), array.len());       // Bit 0 not found => index out of range
  }
}

#[cfg(test)]
mod highest_bit_position {
  use crate::utils::bit_utils::highest_bit_position;

  #[test]
  fn it_should_not_exist() {
    assert_eq!(highest_bit_position(0), 0);
  }

  #[test]
  fn it_should_be_0_in_1() {
    assert_eq!(highest_bit_position(1), 0);
  }

  #[test]
  fn it_should_be_1_in_10() {
    assert_eq!(highest_bit_position(2), 1);
  }

  #[test]
  fn it_should_be_1_in_11() {
    assert_eq!(highest_bit_position(3), 1);
  }

  #[test]
  fn it_should_be_2_in_100() {
    assert_eq!(highest_bit_position(4), 2);
  }

  #[test]
  fn it_should_be_2_in_101() {
    assert_eq!(highest_bit_position(5), 2);
  }

  #[test]
  fn it_should_be_2_in_110() {
    assert_eq!(highest_bit_position(6), 2);
  }

  #[test]
  fn it_should_be_2_in_111() {
    assert_eq!(highest_bit_position(7), 2);
  }

  #[test]
  fn it_should_be_3_in_1000() {
    assert_eq!(highest_bit_position(8), 3);
  }

  #[test]
  fn it_should_be_3_in_1001() {
    assert_eq!(highest_bit_position(9), 3);
  }

  #[test]
  fn it_should_be_4_in_10000() {
    assert_eq!(highest_bit_position(16), 4);
  }

  #[test]
  fn it_should_be_4_in_10001() {
    assert_eq!(highest_bit_position(17), 4);
  }

  #[test]
  fn it_should_be_4_in_10010() {
    assert_eq!(highest_bit_position(18), 4);
  }

  #[test]
  fn it_should_be_35_in_100000_010101_010101_010101_010101_010101() {
    assert_eq!(highest_bit_position(0b_100000_010101_010101_010101_010101_010101), 35);
  }

  #[test]
  fn it_should_match_highest_bit_position_function() {
    fn local_highest_bit_position(value: u64) -> usize {
      let mut index = 0;
      let mut bit = 1;
      while bit <= value {
        bit <<= 1;
        index += 1;
      }

      index - 1
    }

    let mut acc = 0;
    for index in 0..63 {
      let power = u64::pow(2, index);
      acc += power;
      assert_eq!(highest_bit_position(power), index as usize);
      assert_eq!(highest_bit_position(acc), local_highest_bit_position(acc));
    }
  }
}

#[cfg(test)]
mod power_of_2_bit_position {
  use crate::utils::bit_utils::power_of_2_bit_positions;

  #[test]
  fn should_match() {
    assert_eq!(power_of_2_bit_positions(1), 0);
    assert_eq!(power_of_2_bit_positions(2), 1);
    assert_eq!(power_of_2_bit_positions(4), 2);
    assert_eq!(power_of_2_bit_positions(8), 3);
    assert_eq!(power_of_2_bit_positions(16), 4);
    assert_eq!(power_of_2_bit_positions(32), 5);
    assert_eq!(power_of_2_bit_positions(64), 6);
    assert_eq!(power_of_2_bit_positions(128), 7);
    assert_eq!(power_of_2_bit_positions(256), 8);
    assert_eq!(power_of_2_bit_positions(512), 9);
    assert_eq!(power_of_2_bit_positions(1024), 10);

    for index in 0..64 {
      assert_eq!(power_of_2_bit_positions(1 << index), index);
    }

    assert_eq!(power_of_2_bit_positions(0b_10000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000), 63);
  }
}
