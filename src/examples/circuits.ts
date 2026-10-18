import { Circuit } from '../types/circuit';
import { GATE_CATALOG } from '../simulator/definitions';

function createGate(
  id: string,
  type: keyof typeof GATE_CATALOG,
  name: string,
  x: number,
  y: number,
  state: any = {}
) {
  const meta = GATE_CATALOG[type];
  return {
    id,
    type,
    name,
    x,
    y,
    rotation: 0 as const,
    inputs: meta.inputs.map((pin, i) => ({ ...pin, id: pin.name })),
    outputs: meta.outputs.map((pin, i) => ({ ...pin, id: pin.name })),
    delayNs: meta.defaultDelay,
    state,
  };
}

export const EXAMPLES: Record<string, Circuit> = {
  // 1. Full Adder Combinational Circuit
  full_adder: {
    id: 'full_adder',
    name: '1-Bit Full Adder (TkGate Ex1)',
    description: 'Classic TkGate combinational circuit using 2 XOR gates, 2 AND gates, and 1 OR gate with input switches and indicator LEDs.',
    timeNs: 0,
    gates: [
      createGate('sw_a', 'SWITCH', 'Input A', 80, 100, { val: 1 }),
      createGate('sw_b', 'SWITCH', 'Input B', 80, 200, { val: 1 }),
      createGate('sw_cin', 'SWITCH', 'Carry In (Cin)', 80, 300, { val: 0 }),
      createGate('xor1', 'XOR', 'XOR 1', 240, 140),
      createGate('xor2', 'XOR', 'XOR 2 (Sum)', 420, 160),
      createGate('and1', 'AND', 'AND 1', 240, 240),
      createGate('and2', 'AND', 'AND 2', 420, 280),
      createGate('or1', 'OR', 'OR 1 (Cout)', 580, 260),
      createGate('led_sum', 'LED', 'SUM (S)', 580, 160, { color: '#10b981' }),
      createGate('led_cout', 'LED', 'CARRY OUT (Cout)', 720, 260, { color: '#ef4444' }),
    ],
    wires: [
      // SW A to XOR1 and AND1
      { id: 'w1', fromGateId: 'sw_a', fromPinId: 'Q', toGateId: 'xor1', toPinId: 'A', busWidth: 1, state: 1 },
      { id: 'w2', fromGateId: 'sw_a', fromPinId: 'Q', toGateId: 'and1', toPinId: 'A', busWidth: 1, state: 1 },
      // SW B to XOR1 and AND1
      { id: 'w3', fromGateId: 'sw_b', fromPinId: 'Q', toGateId: 'xor1', toPinId: 'B', busWidth: 1, state: 1 },
      { id: 'w4', fromGateId: 'sw_b', fromPinId: 'Q', toGateId: 'and1', toPinId: 'B', busWidth: 1, state: 1 },
      // XOR1 out to XOR2 and AND2
      { id: 'w5', fromGateId: 'xor1', fromPinId: 'Z', toGateId: 'xor2', toPinId: 'A', busWidth: 1, state: 0 },
      { id: 'w6', fromGateId: 'xor1', fromPinId: 'Z', toGateId: 'and2', toPinId: 'A', busWidth: 1, state: 0 },
      // Cin to XOR2 and AND2
      { id: 'w7', fromGateId: 'sw_cin', fromPinId: 'Q', toGateId: 'xor2', toPinId: 'B', busWidth: 1, state: 0 },
      { id: 'w8', fromGateId: 'sw_cin', fromPinId: 'Q', toGateId: 'and2', toPinId: 'B', busWidth: 1, state: 0 },
      // XOR2 out to LED Sum
      { id: 'w9', fromGateId: 'xor2', fromPinId: 'Z', toGateId: 'led_sum', toPinId: 'IN', busWidth: 1, state: 0 },
      // AND1 and AND2 to OR1
      { id: 'w10', fromGateId: 'and2', fromPinId: 'Z', toGateId: 'or1', toPinId: 'A', busWidth: 1, state: 0 },
      { id: 'w11', fromGateId: 'and1', fromPinId: 'Z', toGateId: 'or1', toPinId: 'B', busWidth: 1, state: 1 },
      // OR1 out to LED Cout
      { id: 'w12', fromGateId: 'or1', fromPinId: 'Z', toGateId: 'led_cout', toPinId: 'IN', busWidth: 1, state: 1 },
    ],
  },

  // 2. 4-Bit Counter with 7-Segment Display (TkGate Ex3)
  counter_7seg: {
    id: 'counter_7seg',
    name: '4-Bit Counter & 7-Segment Display (TkGate Ex3)',
    description: 'Sequential circuit with a periodic clock, 4-bit binary counter, reset switch, and live 7-segment hexadecimal display.',
    timeNs: 0,
    gates: [
      createGate('clk1', 'CLOCK', 'Clock (2 Hz)', 100, 180, { clockFreq: 2 }),
      createGate('sw_reset', 'SWITCH', 'Clear / Reset', 100, 260, { val: 0 }),
      createGate('cnt1', 'COUNTER4', '4-Bit Counter', 280, 170, { val: 0 }),
      createGate('disp1', 'SEVEN_SEG', '7-Segment Display', 480, 150),
      createGate('hex1', 'HEX_DISP', 'Hex Digit', 600, 160),
      createGate('led_rco', 'LED', 'Carry (RCO)', 480, 270, { color: '#f59e0b' }),
    ],
    wires: [
      { id: 'w_clk', fromGateId: 'clk1', fromPinId: 'CLK', toGateId: 'cnt1', toPinId: 'CLK', busWidth: 1, state: 0 },
      { id: 'w_clr', fromGateId: 'sw_reset', fromPinId: 'Q', toGateId: 'cnt1', toPinId: 'CLR', busWidth: 1, state: 0 },
      // Counter outputs to 7-segment
      { id: 'w_q0', fromGateId: 'cnt1', fromPinId: 'Q0', toGateId: 'disp1', toPinId: 'D0', busWidth: 1, state: 0 },
      { id: 'w_q1', fromGateId: 'cnt1', fromPinId: 'Q1', toGateId: 'disp1', toPinId: 'D1', busWidth: 1, state: 0 },
      { id: 'w_q2', fromGateId: 'cnt1', fromPinId: 'Q2', toGateId: 'disp1', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'w_q3', fromGateId: 'cnt1', fromPinId: 'Q3', toGateId: 'disp1', toPinId: 'D3', busWidth: 1, state: 0 },
      // Counter outputs to Hex Display
      { id: 'w_h0', fromGateId: 'cnt1', fromPinId: 'Q0', toGateId: 'hex1', toPinId: 'D0', busWidth: 1, state: 0 },
      { id: 'w_h1', fromGateId: 'cnt1', fromPinId: 'Q1', toGateId: 'hex1', toPinId: 'D1', busWidth: 1, state: 0 },
      { id: 'w_h2', fromGateId: 'cnt1', fromPinId: 'Q2', toGateId: 'hex1', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'w_h3', fromGateId: 'cnt1', fromPinId: 'Q3', toGateId: 'hex1', toPinId: 'D3', busWidth: 1, state: 0 },
      // RCO to LED
      { id: 'w_rco', fromGateId: 'cnt1', fromPinId: 'RCO', toGateId: 'led_rco', toPinId: 'IN', busWidth: 1, state: 0 },
    ],
  },

  // 3. 4-Bit Arithmetic Logic Unit (ALU)
  alu_4bit: {
    id: 'alu_4bit',
    name: '4-Bit Arithmetic Logic Unit (ALU)',
    description: 'Processes two 4-bit numbers (A and B) through Full Adder, Subtractor, Comparator and Multiplexers with condition flags.',
    timeNs: 0,
    gates: [
      createGate('dip_a', 'DIP4', 'Operand A', 100, 100, { val: 5 }), // A = 5
      createGate('dip_b', 'DIP4', 'Operand B', 100, 240, { val: 3 }), // B = 3
      createGate('adder', 'ADDER4', '4-Bit Adder (A+B)', 280, 100),
      createGate('sub', 'SUB4', '4-Bit Subtractor (A-B)', 280, 250),
      createGate('comp', 'COMP4', 'Comparator', 280, 400),
      createGate('hex_res', 'HEX_DISP', 'Adder Result', 480, 110),
      createGate('hex_diff', 'HEX_DISP', 'Subtractor Result', 480, 260),
      createGate('led_gt', 'LED', 'A > B', 480, 400, { color: '#10b981' }),
      createGate('led_eq', 'LED', 'A == B', 480, 440, { color: '#3b82f6' }),
      createGate('led_lt', 'LED', 'A < B', 480, 480, { color: '#ef4444' }),
    ],
    wires: [
      // Connect A to Adder & Sub
      { id: 'wa0', fromGateId: 'dip_a', fromPinId: 'Q0', toGateId: 'adder', toPinId: 'A0', busWidth: 1, state: 1 },
      { id: 'wa1', fromGateId: 'dip_a', fromPinId: 'Q1', toGateId: 'adder', toPinId: 'A1', busWidth: 1, state: 0 },
      { id: 'wa2', fromGateId: 'dip_a', fromPinId: 'Q2', toGateId: 'adder', toPinId: 'A2', busWidth: 1, state: 1 },
      { id: 'wa3', fromGateId: 'dip_a', fromPinId: 'Q3', toGateId: 'adder', toPinId: 'A3', busWidth: 1, state: 0 },
      { id: 'wa0_s', fromGateId: 'dip_a', fromPinId: 'Q0', toGateId: 'sub', toPinId: 'A0', busWidth: 1, state: 1 },
      { id: 'wa1_s', fromGateId: 'dip_a', fromPinId: 'Q1', toGateId: 'sub', toPinId: 'A1', busWidth: 1, state: 0 },
      { id: 'wa2_s', fromGateId: 'dip_a', fromPinId: 'Q2', toGateId: 'sub', toPinId: 'A2', busWidth: 1, state: 1 },
      { id: 'wa3_s', fromGateId: 'dip_a', fromPinId: 'Q3', toGateId: 'sub', toPinId: 'A3', busWidth: 1, state: 0 },
      // Connect B to Adder & Sub
      { id: 'wb0', fromGateId: 'dip_b', fromPinId: 'Q0', toGateId: 'adder', toPinId: 'B0', busWidth: 1, state: 1 },
      { id: 'wb1', fromGateId: 'dip_b', fromPinId: 'Q1', toGateId: 'adder', toPinId: 'B1', busWidth: 1, state: 1 },
      { id: 'wb2', fromGateId: 'dip_b', fromPinId: 'Q2', toGateId: 'adder', toPinId: 'B2', busWidth: 1, state: 0 },
      { id: 'wb3', fromGateId: 'dip_b', fromPinId: 'Q3', toGateId: 'adder', toPinId: 'B3', busWidth: 1, state: 0 },
      { id: 'wb0_s', fromGateId: 'dip_b', fromPinId: 'Q0', toGateId: 'sub', toPinId: 'B0', busWidth: 1, state: 1 },
      { id: 'wb1_s', fromGateId: 'dip_b', fromPinId: 'Q1', toGateId: 'sub', toPinId: 'B1', busWidth: 1, state: 1 },
      { id: 'wb2_s', fromGateId: 'dip_b', fromPinId: 'Q2', toGateId: 'sub', toPinId: 'B2', busWidth: 1, state: 0 },
      { id: 'wb3_s', fromGateId: 'dip_b', fromPinId: 'Q3', toGateId: 'sub', toPinId: 'B3', busWidth: 1, state: 0 },
      // Connect to comparator
      { id: 'wca0', fromGateId: 'dip_a', fromPinId: 'Q0', toGateId: 'comp', toPinId: 'A0', busWidth: 1, state: 1 },
      { id: 'wcb0', fromGateId: 'dip_b', fromPinId: 'Q0', toGateId: 'comp', toPinId: 'B0', busWidth: 1, state: 1 },
      // Adder out to Hex
      { id: 'ws0', fromGateId: 'adder', fromPinId: 'S0', toGateId: 'hex_res', toPinId: 'D0', busWidth: 1, state: 0 },
      { id: 'ws1', fromGateId: 'adder', fromPinId: 'S1', toGateId: 'hex_res', toPinId: 'D1', busWidth: 1, state: 0 },
      { id: 'ws2', fromGateId: 'adder', fromPinId: 'S2', toGateId: 'hex_res', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'ws3', fromGateId: 'adder', fromPinId: 'S3', toGateId: 'hex_res', toPinId: 'D3', busWidth: 1, state: 1 },
      // Sub out to Hex
      { id: 'wd0', fromGateId: 'sub', fromPinId: 'D0', toGateId: 'hex_diff', toPinId: 'D0', busWidth: 1, state: 0 },
      { id: 'wd1', fromGateId: 'sub', fromPinId: 'D1', toGateId: 'hex_diff', toPinId: 'D1', busWidth: 1, state: 1 },
      { id: 'wd2', fromGateId: 'sub', fromPinId: 'D2', toGateId: 'hex_diff', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'wd3', fromGateId: 'sub', fromPinId: 'D3', toGateId: 'hex_diff', toPinId: 'D3', busWidth: 1, state: 0 },
      // Comp out to LEDs
      { id: 'wgt', fromGateId: 'comp', fromPinId: 'GT', toGateId: 'led_gt', toPinId: 'IN', busWidth: 1, state: 1 },
      { id: 'weq', fromGateId: 'comp', fromPinId: 'EQ', toGateId: 'led_eq', toPinId: 'IN', busWidth: 1, state: 0 },
      { id: 'wlt', fromGateId: 'comp', fromPinId: 'LT', toGateId: 'led_lt', toPinId: 'IN', busWidth: 1, state: 0 },
    ],
  },

  // 4. Memory RAM Read / Write Testbench
  ram_demo: {
    id: 'ram_demo',
    name: 'RAM 16x8 Read/Write Memory Testbench',
    description: 'Interactive Random Access Memory testbench with address select, data input, write strobe, and readback display.',
    timeNs: 0,
    gates: [
      createGate('addr_sw', 'DIP4', 'Address (A0..A3)', 80, 100, { val: 2 }),
      createGate('data_sw', 'DIP4', 'Data In (DI0..DI3)', 80, 240, { val: 9 }),
      createGate('btn_we', 'BUTTON', 'Write Pulse (WE)', 80, 370),
      createGate('sw_cs', 'SWITCH', 'Chip Select (CS)', 80, 440, { val: 1 }),
      createGate('ram1', 'RAM16x8', '16x8 RAM', 280, 180, {
        memory: [0x1, 0x4, 0x9, 0xC, 0x0, 0x2, 0x5, 0x7, 0x8, 0xA, 0xB, 0xD, 0xE, 0xF, 0x3, 0x6]
      }),
      createGate('hex_out', 'HEX_DISP', 'Data Output', 520, 200),
      createGate('led_we', 'LED', 'Write Active', 520, 360, { color: '#f59e0b' }),
    ],
    wires: [
      // Address lines
      { id: 'w_a0', fromGateId: 'addr_sw', fromPinId: 'Q0', toGateId: 'ram1', toPinId: 'A0', busWidth: 1, state: 0 },
      { id: 'w_a1', fromGateId: 'addr_sw', fromPinId: 'Q1', toGateId: 'ram1', toPinId: 'A1', busWidth: 1, state: 1 },
      { id: 'w_a2', fromGateId: 'addr_sw', fromPinId: 'Q2', toGateId: 'ram1', toPinId: 'A2', busWidth: 1, state: 0 },
      { id: 'w_a3', fromGateId: 'addr_sw', fromPinId: 'Q3', toGateId: 'ram1', toPinId: 'A3', busWidth: 1, state: 0 },
      // Data in lines
      { id: 'w_di0', fromGateId: 'data_sw', fromPinId: 'Q0', toGateId: 'ram1', toPinId: 'DI0', busWidth: 1, state: 1 },
      { id: 'w_di1', fromGateId: 'data_sw', fromPinId: 'Q1', toGateId: 'ram1', toPinId: 'DI1', busWidth: 1, state: 0 },
      { id: 'w_di2', fromGateId: 'data_sw', fromPinId: 'Q2', toGateId: 'ram1', toPinId: 'DI2', busWidth: 1, state: 0 },
      { id: 'w_di3', fromGateId: 'data_sw', fromPinId: 'Q3', toGateId: 'ram1', toPinId: 'DI3', busWidth: 1, state: 1 },
      // Control lines
      { id: 'w_we', fromGateId: 'btn_we', fromPinId: 'Q', toGateId: 'ram1', toPinId: 'WE', busWidth: 1, state: 0 },
      { id: 'w_clk', fromGateId: 'btn_we', fromPinId: 'Q', toGateId: 'ram1', toPinId: 'CLK', busWidth: 1, state: 0 },
      { id: 'w_cs', fromGateId: 'sw_cs', fromPinId: 'Q', toGateId: 'ram1', toPinId: 'CS', busWidth: 1, state: 1 },
      // Outputs
      { id: 'w_do0', fromGateId: 'ram1', fromPinId: 'DO0', toGateId: 'hex_out', toPinId: 'D0', busWidth: 1, state: 1 },
      { id: 'w_do1', fromGateId: 'ram1', fromPinId: 'DO1', toGateId: 'hex_out', toPinId: 'D1', busWidth: 1, state: 0 },
      { id: 'w_do2', fromGateId: 'ram1', fromPinId: 'DO2', toGateId: 'hex_out', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'w_do3', fromGateId: 'ram1', fromPinId: 'DO3', toGateId: 'hex_out', toPinId: 'D3', busWidth: 1, state: 1 },
      { id: 'w_led_we', fromGateId: 'btn_we', fromPinId: 'Q', toGateId: 'led_we', toPinId: 'IN', busWidth: 1, state: 0 },
    ],
  },

  // 5. Traffic Light State Controller (TkGate Ex4)
  traffic_light: {
    id: 'traffic_light',
    name: 'Traffic Light FSM Controller (TkGate Ex4)',
    description: 'Sequential finite state machine generating North-South and East-West Green, Yellow, and Red signals.',
    timeNs: 0,
    gates: [
      createGate('clk', 'CLOCK', 'Timer Clock', 80, 200, { clockFreq: 1 }),
      createGate('cnt', 'COUNTER4', 'State Counter', 220, 180, { val: 0 }),
      createGate('dec', 'DEC38', 'Phase Decoder', 380, 140),
      createGate('led_ns_g', 'LED', 'NS Green', 560, 100, { color: '#10b981' }),
      createGate('led_ns_y', 'LED', 'NS Yellow', 560, 150, { color: '#f59e0b' }),
      createGate('led_ns_r', 'LED', 'NS Red', 560, 200, { color: '#ef4444' }),
      createGate('led_ew_g', 'LED', 'EW Green', 560, 270, { color: '#10b981' }),
      createGate('led_ew_y', 'LED', 'EW Yellow', 560, 320, { color: '#f59e0b' }),
      createGate('led_ew_r', 'LED', 'EW Red', 560, 370, { color: '#ef4444' }),
    ],
    wires: [
      { id: 'w_tclk', fromGateId: 'clk', fromPinId: 'CLK', toGateId: 'cnt', toPinId: 'CLK', busWidth: 1, state: 0 },
      { id: 'w_c0', fromGateId: 'cnt', fromPinId: 'Q0', toGateId: 'dec', toPinId: 'A0', busWidth: 1, state: 0 },
      { id: 'w_c1', fromGateId: 'cnt', fromPinId: 'Q1', toGateId: 'dec', toPinId: 'A1', busWidth: 1, state: 0 },
      { id: 'w_c2', fromGateId: 'cnt', fromPinId: 'Q2', toGateId: 'dec', toPinId: 'A2', busWidth: 1, state: 0 },
      // Phase decoder to light outputs
      { id: 'w_p0', fromGateId: 'dec', fromPinId: 'Y0', toGateId: 'led_ns_g', toPinId: 'IN', busWidth: 1, state: 1 },
      { id: 'w_p1', fromGateId: 'dec', fromPinId: 'Y2', toGateId: 'led_ns_y', toPinId: 'IN', busWidth: 1, state: 0 },
      { id: 'w_p2', fromGateId: 'dec', fromPinId: 'Y4', toGateId: 'led_ns_r', toPinId: 'IN', busWidth: 1, state: 0 },
      { id: 'w_p3', fromGateId: 'dec', fromPinId: 'Y4', toGateId: 'led_ew_g', toPinId: 'IN', busWidth: 1, state: 0 },
      { id: 'w_p4', fromGateId: 'dec', fromPinId: 'Y6', toGateId: 'led_ew_y', toPinId: 'IN', busWidth: 1, state: 0 },
      { id: 'w_p5', fromGateId: 'dec', fromPinId: 'Y0', toGateId: 'led_ew_r', toPinId: 'IN', busWidth: 1, state: 1 },
    ],
  },

  // 6. TkGate Menagerie Microcoded Processor / TTY Demo (TkGate Ex5)
  menagerie: {
    id: 'menagerie',
    name: 'TkGate Menagerie & TTY Terminal (TkGate Ex5)',
    description: 'Iconic microprogrammed processor demonstration featuring ROM instruction fetch, registers, and serial TTY terminal.',
    timeNs: 0,
    gates: [
      createGate('clk', 'CLOCK', 'System Clock (4 Hz)', 80, 160, { clockFreq: 4 }),
      createGate('pc', 'COUNTER4', 'Program Counter', 220, 140, { val: 0 }),
      createGate('rom', 'ROM16x8', 'Microcode ROM', 380, 120, {
        memory: [0x01, 0x02, 0x03, 0x04, 0x05, 0x08, 0x0C, 0x0F, 0x12, 0x15, 0x18, 0x1B, 0x1E, 0x20, 0x00, 0x01]
      }),
      createGate('tty', 'TTY', 'TkGate Virtual Terminal', 560, 140, {
        ttyText: 'TKGATE READY > '
      }),
    ],
    wires: [
      { id: 'w_mclk', fromGateId: 'clk', fromPinId: 'CLK', toGateId: 'pc', toPinId: 'CLK', busWidth: 1, state: 0 },
      { id: 'w_mpc0', fromGateId: 'pc', fromPinId: 'Q0', toGateId: 'rom', toPinId: 'A0', busWidth: 1, state: 0 },
      { id: 'w_mpc1', fromGateId: 'pc', fromPinId: 'Q1', toGateId: 'rom', toPinId: 'A1', busWidth: 1, state: 0 },
      { id: 'w_mpc2', fromGateId: 'pc', fromPinId: 'Q2', toGateId: 'rom', toPinId: 'A2', busWidth: 1, state: 0 },
      { id: 'w_mpc3', fromGateId: 'pc', fromPinId: 'Q3', toGateId: 'rom', toPinId: 'A3', busWidth: 1, state: 0 },
      // ROM data out to TTY
      { id: 'w_rd0', fromGateId: 'rom', fromPinId: 'D0', toGateId: 'tty', toPinId: 'D0', busWidth: 1, state: 1 },
      { id: 'w_rd1', fromGateId: 'rom', fromPinId: 'D1', toGateId: 'tty', toPinId: 'D1', busWidth: 1, state: 0 },
      { id: 'w_rd2', fromGateId: 'rom', fromPinId: 'D2', toGateId: 'tty', toPinId: 'D2', busWidth: 1, state: 0 },
      { id: 'w_rd3', fromGateId: 'rom', fromPinId: 'D3', toGateId: 'tty', toPinId: 'D3', busWidth: 1, state: 0 },
      { id: 'w_strb', fromGateId: 'clk', fromPinId: 'CLK', toGateId: 'tty', toPinId: 'STRB', busWidth: 1, state: 0 },
    ],
  },
};
