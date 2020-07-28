# Add WebAssembly to React App (ejected create-react-app)

## NOTE: Rebuild Rust code
```bash
wasm-pack build
```
Remove and re-add wasm (updating dependency) in package.json
```bash
"wasm": "file:./crate/pkg",
```
Restart server

## Create a Rust lib
```bash
cargo new rust-app --lib
```
Rename ‘rust-app’ directory to crate (could not call it crate when creating)

### Add wasm-bindgen
Cargo.toml
```bash
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2.63"
```

Update dependencies:
```bash
cargo update
```

### Add wasm_bindgen import and #[wasm_bindgen] decorator to exported functions 
lib.rs
```bash
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(num1: u32, num2: u32) -> u32 {
  num1 + num2
}
```

Build pkg directory (re-build when Rust code modified)
```bash
wasm-pack build
```

## Update React App

```bash
yarn add react-app-rewired wasm-loader -D
```

config-overrides.js
```bash
const path = require('path');

module.exports = function override(config, env) {
  const wasmExtensionRegExp = /\.wasm$/;

  config.resolve.extensions.push('.wasm');

  config.module.rules.forEach(rule => {
    (rule.oneOf || []).forEach(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        // make file-loader ignore WASM files
        oneOf.exclude.push(wasmExtensionRegExp);
      }
    });
  });

  // add a dedicated loader for WASM
  config.module.rules.push({
    test: wasmExtensionRegExp,
    include: path.resolve(__dirname, 'src'),
    use: [{ loader: require.resolve('wasm-loader'), options: {} }]
  });

  return config;
};
```

package.json
```bash
"scripts": {
  "start": "react-app-rewired start",
  "build": "react-app-rewired build",
  "test": "react-app-rewired test"
}

dependencies: {
  …
  “wasm2: "file:./rust-app/pkg”
}
```

### Manualy add wasm-loader
package.json
```bash
    "moduleFileExtensions": [
      …
      "wasm"
    ],
```

webpack.config.js
```bash
module: {
      …
      rules: [
        …
        {
          test: /\.wasm$/,
          include: path.resolve(__dirname, 'src'),
          use: [{ loader: require.resolve('wasm-loader'), options: {} }]
        }
      ]
```

### Call the WASM function from React
```bash
const loadWasm = async () => {
  try {
    const wasm = await import('wasm’);
    console.log(wasm.add(2, 3));
  } catch(err) {
    console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
  }
};
```
