// Population count
pub fn number_of_bits_set(bits: usize) -> usize {
  let mut count = 0;
  let mut remaining_bits = bits;
  while remaining_bits > 0 {
    remaining_bits &= remaining_bits - 1;
    count += 1;
  }

  count
}

// Return bits set within all passed elements (not XOR)
pub fn bitwise_or(elements: &[usize]) -> usize {
  let mut total_ored = 0;
  for element in elements.iter() {
    total_ored |= element;
  }

  total_ored
}

// XOR all the values passed in to find an only option
pub fn only_option(options: &[usize]) -> (bool, usize) {
  let mut option = 0;
  let mut filled = 0;
  for element in options.iter() {
    if element & element - 1 > 0 {                                  // Not a single base of 2 number (1, 2, 4, 8, ...)
      filled |= option & element;
      option ^= element;                                            // XOR
    }
  }

  option &= !filled;
  (option > 0 && (option & option - 1) == 0, option)                // Single base of 2 number, but not 0
}

// Index of first item in array containing bit
pub fn containing_bit_index(array: &[usize], bit: usize) -> usize {
  let mut index = 0;
  while index < array.len() && (array[index] & bit) == 0 {
    index += 1;
  }

  index
}

pub fn highest_bit_position(v: usize) -> usize {
  let multiply_de_bruijn_bit_position = [
    0, 9, 1, 10, 13, 21, 2, 29, 11, 14, 16, 18, 22, 25, 3, 30,
    8, 12, 20, 28, 15, 17, 24, 7, 19, 27, 23, 6, 26, 5, 4, 31];

  fn highest_bit_index(mut n: usize) -> usize {
    let mut bit = 0b1;
    let mut next = n | n >> 1;
    while next != n {
      n = next;
      bit <<= 1;
      next = n | n >> bit;
    }

    (n * 0x07C4ACDD >> 27) % 32
  }

  if v > 0xFFFFFFFF {                                               // more than 32 bits -> calc top half
    panic!("attempt to shift right with overflow --- problem only in wasm_bindgen");
    return 32 + multiply_de_bruijn_bit_position[highest_bit_index(v >> 32)];
  }

  multiply_de_bruijn_bit_position[highest_bit_index(v)]
}

pub fn power_of_2_bit_positions(bit: usize) -> usize {
  let mut remaining_bit = bit;
  let mut index = 0;
  while remaining_bit > 1 {
    remaining_bit >>= 1;
    index += 1;
  }

  index
}

// export const power_of_2_bit_positions: IHashMapOfPowerOf2 = {
//     1: 0, 2: 1, 4: 2, 8: 3, 16: 4, 32: 5, 64: 6, 128: 7, 256: 8, 512: 9, 1024: 10, 2048: 11, 4096: 12, 8192: 13, 16384: 14, 32768: 15, 65536: 16, 131072: 17, 262144: 18,
//     524288: 19, 1048576: 20, 2097152: 21, 4194304: 22, 8388608: 23, 16777216: 24, 33554432: 25, 67108864: 26, 134217728: 27, 268435456: 28, 536870912: 29, 1073741824: 30, 2147483648: 31
// }
