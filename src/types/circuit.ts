export type LogicValue = 0 | 1 | 'Z' | 'X';

export type GateCategory = 
  | 'basic'
  | 'inputs'
  | 'outputs'
  | 'arithmetic'
  | 'routing'
  | 'sequential'
  | 'memory'
  | 'annotations';

export type GateType =
  // Basic
  | 'AND' | 'NAND' | 'OR' | 'NOR' | 'XOR' | 'XNOR' | 'NOT' | 'BUF' | 'TRI'
  // Inputs
  | 'SWITCH' | 'BUTTON' | 'DIP4' | 'CLOCK' | 'VDD' | 'GND'
  // Outputs
  | 'LED' | 'SEVEN_SEG' | 'HEX_DISP' | 'TTY'
  // Arithmetic
  | 'ADDER4' | 'SUB4' | 'MULT4' | 'COMP4'
  // Routing
  | 'MUX2' | 'MUX4' | 'DEMUX2' | 'DEC38'
  // Sequential
  | 'DFF' | 'JKFF' | 'TFF' | 'LATCH' | 'REG4' | 'COUNTER4'
  // Memory
  | 'RAM16x8' | 'ROM16x8'
  // Annotations
  | 'COMMENT';

export interface Pin {
  id: string;
  name: string;
  type: 'in' | 'out' | 'inout' | 'clk';
  relX: number; // offset from gate x
  relY: number; // offset from gate y
  busWidth?: number; // 1 for single wire, >1 for bus
  inverted?: boolean;
}

export interface Gate {
  id: string;
  type: GateType;
  name: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  inputs: Pin[];
  outputs: Pin[];
  state: {
    val?: LogicValue | number; // For switches, buttons, registers
    values?: LogicValue[];     // For multi-bit pins
    memory?: number[];         // For RAM/ROM (e.g. 16 or 256 bytes)
    ttyText?: string;          // For TTY terminal
    clockFreq?: number;        // In Hz
    clockState?: 0 | 1;
    color?: string;            // For LED
    commentText?: string;
  };
  delayNs: number;
}

export interface Wire {
  id: string;
  name?: string;
  fromGateId: string;
  fromPinId: string;
  toGateId: string;
  toPinId: string;
  busWidth: number;
  waypoints?: { x: number; y: number }[];
  state: LogicValue;
  busState?: number; // if busWidth > 1
}

export interface Circuit {
  id: string;
  name: string;
  description: string;
  gates: Gate[];
  wires: Wire[];
  timeNs: number;
}

export interface WaveformSample {
  timeNs: number;
  value: LogicValue;
  busValue?: number;
}

export interface ScopeChannel {
  wireId: string;
  wireName: string;
  color: string;
  busWidth: number;
  samples: WaveformSample[];
}
