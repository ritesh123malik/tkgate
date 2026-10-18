# TkGate Web — Digital Circuit Editor & Event-Driven Simulator

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL%202.0-yellow.svg?style=flat-square)](https://gnu.org/licenses/gpl-2.0.html)

**TkGate Web** is an open-source, full-featured web-based digital circuit editor, event-driven logic simulator, and multi-channel waveform analyzer. It brings the power of the classic TkGate digital CAD system directly to modern web browsers with zero installation required.

---

## Key Features

### 1. Interactive Digital Schematic Editor
- **Grid Canvas**: Smooth pan and zoom, 10px snap-to-grid, vector IEEE logic symbols.
- **Orthogonal Wire Routing**: Live multi-bit buses, pin snapping, junction dots, dynamic signal states.
- **Component Palette**: Drag-and-drop or click-to-place gates with rotation ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).
- **Direct Hardware Interactivity**: Click toggle switches, pulse push buttons, configure DIP switches in real time.

### 2. Comprehensive Gate & Chip Library
- **Basic Logic**: `AND`, `NAND`, `OR`, `NOR`, `XOR`, `XNOR`, `NOT` (Inverter), `Buffer`, `Tri-State Buffer`.
- **Inputs & Clocks**: Toggle Switch, Push Button, 4-Bit DIP Switch, Clock Generator with configurable frequency, Vdd (+5V), Ground (0V).
- **Indicators & Displays**: Color-selectable LED indicators, 7-Segment Display with hex decoding, Hex Digit Display, and TkGate TTY Terminal.
- **Arithmetic / ALU**: 4-Bit Full Adder, 4-Bit Subtractor, 2-Bit Multiplier, 4-Bit Magnitude Comparator.
- **Multiplexers & Decoders**: 2-to-1 MUX, 4-to-1 MUX, 1-to-2 Demux, 3-to-8 Decoder.
- **Sequential Logic**: D Flip-Flop, JK Flip-Flop, T Flip-Flop, SR Latch, 4-Bit Register with parallel load, 4-Bit Synchronous Counter.
- **Memory**: 16x8 RAM with write enable, 16x8 ROM with built-in memory images and interactive Hex Memory Editor.

### 3. Event-Driven Logic Simulator
- **4-State Logic**: Implements `0` (Low), `1` (High), `Z` (High-Impedance), and `X` (Unknown / Contention).
- **Simulation Modes**: Continuous real-time execution, single-step execution, and reset.
- **Speed Control**: Variable clock/simulation frequency from 1 Hz up to 100 Hz.
- **Color-Coded Wire State**: Active green glowing wires for logic 1, slate blue for logic 0, amber for Z, red for X.

### 4. Multi-Channel Logic Analyzer (Waveform Scope)
- Built-in multi-channel digital oscilloscope matching TkGate's `scope.tcl`.
- Live signal transitions over simulation time (ns).
- Probe any net or wire with one click.

### 5. Verilog HDL Generation & Export
- Generates TkGate-compatible Verilog netlists (`.v`) with module instantiations and primitives.
- Copy or download `.v` files compatible with standalone Verga and standard EDA tools.

### 6. Pre-Loaded Classic TkGate Examples
- **1-Bit Full Adder (Ex1)**: Gate-level adder with sum and carry LEDs.
- **4-Bit Counter & 7-Segment Display (Ex3)**: Clocked counter with 7-segment hex output.
- **4-Bit Arithmetic Logic Unit (ALU)**: Adder, Subtractor, Comparator with condition flags.
- **RAM 16x8 Read/Write Memory**: Interactive memory testbench with DIP switches.
- **Traffic Light FSM Controller (Ex4)**: State machine sequencing North-South and East-West signals.
- **Menagerie & TTY Terminal (Ex5)**: Microcoded processor with ASCII terminal output.

---

## Getting Started

### Local Development

```bash
# Clone the repository
git clone https://github.com/ritesh123malik/tkgate.git
cd tkgate

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## Deployment to Vercel

Deploy directly using the Vercel CLI:

```bash
npx vercel --prod
```

Or connect the GitHub repository to the [Vercel Dashboard](https://vercel.com/new).

---

## License

This project is licensed under the **GNU General Public License v2.0 or later** (GPL-2.0-or-later) in accordance with upstream TkGate.
