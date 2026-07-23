#!/bin/bash

echo "Building PHIKL1..."
echo "=================="
echo ""

if ! command -v cargo &> /dev/null
then
    echo "Error: Rust/Cargo is not installed."
    echo "Please install Rust from https://rustup.rs/"
    exit 1
fi

echo "Building in release mode..."
cargo build --release

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "Executable: target/release/phikl1"
    echo ""
    echo "Example usage:"
    echo ""
    echo "  Single dose (one-compartment):"
    echo "    ./target/release/phikl1 examples/config_1comp.json"
    echo ""
    echo "  Single dose (two-compartment):"
    echo "    ./target/release/phikl1 examples/config_2comp.json"
    echo ""
    echo "  Multiple dose (q12h dosing):"
    echo "    ./target/release/phikl1 examples/config_multiple_dose.json"
    echo ""
    echo "  With command-line options:"
    echo "    ./target/release/phikl1 examples/config_1comp.json --o my_output --n_iter 500 --seed 99999"
    echo ""
    echo "See QUICK_START.md for more examples and DOSING_GUIDE.md for comprehensive documentation."
else
    echo ""
    echo "✗ Build failed!"
    exit 1
fi
