use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(num1: u32, num2: u32) -> u32 {
  num1 + num2
}
