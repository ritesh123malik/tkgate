import { Circuit, Gate, Wire, LogicValue, WaveformSample } from '../types/circuit';

export interface SimulationResult {
  circuit: Circuit;
  eventsCount: number;
}

export function evaluateLogicVal(val: any): LogicValue {
  if (val === 1 || val === true || val === '1') return 1;
  if (val === 0 || val === false || val === '0') return 0;
  if (val === 'Z' || val === 'z') return 'Z';
  return 'X';
}

export function logicAnd(a: LogicValue, b: LogicValue): LogicValue {
  if (a === 0 || b === 0) return 0;
  if (a === 1 && b === 1) return 1;
  return 'X';
}

export function logicOr(a: LogicValue, b: LogicValue): LogicValue {
  if (a === 1 || b === 1) return 1;
  if (a === 0 && b === 0) return 0;
  return 'X';
}

export function logicXor(a: LogicValue, b: LogicValue): LogicValue {
  if (a === 'X' || a === 'Z' || b === 'X' || b === 'Z') return 'X';
  return a !== b ? 1 : 0;
}

export function logicNot(a: LogicValue): LogicValue {
  if (a === 1) return 0;
  if (a === 0) return 1;
  return 'X';
}

export class CircuitSimulator {
  private prevClkStates: Record<string, LogicValue> = {};
  private waveformHistory: Record<string, WaveformSample[]> = {};
  private maxHistorySamples = 200;

  public reset() {
    this.prevClkStates = {};
    this.waveformHistory = {};
  }

  public step(circuit: Circuit, dtNs: number = 10): Circuit {
    const nextCircuit: Circuit = {
      ...circuit,
      timeNs: circuit.timeNs + dtNs,
      gates: circuit.gates.map(g => ({
        ...g,
        state: { ...g.state }
      })),
      wires: circuit.wires.map(w => ({ ...w }))
    };

    // Helper map to quickly get pin value driven into a wire
    const pinValues: Record<string, LogicValue> = {}; // key: `${gateId}:${pinId}`

    // 1. First pass: Evaluate input gates (switches, buttons, clocks, Vdd, GND)
    for (const gate of nextCircuit.gates) {
      if (gate.type === 'SWITCH' || gate.type === 'BUTTON') {
        const val = evaluateLogicVal(gate.state.val ?? 0);
        pinValues[`${gate.id}:Q`] = val;
      } else if (gate.type === 'VDD') {
        pinValues[`${gate.id}:1`] = 1;
      } else if (gate.type === 'GND') {
        pinValues[`${gate.id}:0`] = 0;
      } else if (gate.type === 'CLOCK') {
        const freq = gate.state.clockFreq || 1; // Hz
        const halfPeriodNs = Math.max(10, Math.floor(1e9 / (freq * 2)));
        const cycle = Math.floor(nextCircuit.timeNs / halfPeriodNs);
        const clkVal: LogicValue = cycle % 2 === 0 ? 0 : 1;
        gate.state.clockState = clkVal as 0 | 1;
        pinValues[`${gate.id}:CLK`] = clkVal;
      } else if (gate.type === 'DIP4') {
        const dipVal = Number(gate.state.val ?? 0);
        pinValues[`${gate.id}:Q0`] = (dipVal & 1) ? 1 : 0;
        pinValues[`${gate.id}:Q1`] = (dipVal & 2) ? 1 : 0;
        pinValues[`${gate.id}:Q2`] = (dipVal & 4) ? 1 : 0;
        pinValues[`${gate.id}:Q3`] = (dipVal & 8) ? 1 : 0;
      }
    }

    // Propagate wire states from known outputs
    for (const wire of nextCircuit.wires) {
      const srcKey = `${wire.fromGateId}:${wire.fromPinId}`;
      if (srcKey in pinValues) {
        wire.state = pinValues[srcKey];
      }
    }

    // Helper to get input pin value for a gate
    const getPinVal = (gateId: string, pinId: string): LogicValue => {
      // Find wire connecting to this input
      const wire = nextCircuit.wires.find(w => w.toGateId === gateId && w.toPinId === pinId);
      if (!wire) return 0;
      return wire.state;
    };

    // 2. Iterate gate evaluations to handle combinational & sequential logic
    const iterations = 3;
    for (let it = 0; it < iterations; it++) {
      for (const gate of nextCircuit.gates) {
        switch (gate.type) {
          case 'AND': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicAnd(a, b);
            break;
          }
          case 'NAND': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicNot(logicAnd(a, b));
            break;
          }
          case 'OR': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicOr(a, b);
            break;
          }
          case 'NOR': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicNot(logicOr(a, b));
            break;
          }
          case 'XOR': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicXor(a, b);
            break;
          }
          case 'XNOR': {
            const a = getPinVal(gate.id, 'A');
            const b = getPinVal(gate.id, 'B');
            pinValues[`${gate.id}:Z`] = logicNot(logicXor(a, b));
            break;
          }
          case 'NOT': {
            const a = getPinVal(gate.id, 'A');
            pinValues[`${gate.id}:Z`] = logicNot(a);
            break;
          }
          case 'BUF': {
            pinValues[`${gate.id}:Z`] = getPinVal(gate.id, 'A');
            break;
          }
          case 'TRI': {
            const a = getPinVal(gate.id, 'A');
            const en = getPinVal(gate.id, 'EN');
            pinValues[`${gate.id}:Z`] = (en === 1) ? a : 'Z';
            break;
          }
          case 'MUX2': {
            const i0 = getPinVal(gate.id, 'I0');
            const i1 = getPinVal(gate.id, 'I1');
            const sel = getPinVal(gate.id, 'SEL');
            pinValues[`${gate.id}:Z`] = sel === 1 ? i1 : (sel === 0 ? i0 : 'X');
            break;
          }
          case 'MUX4': {
            const i0 = getPinVal(gate.id, 'I0');
            const i1 = getPinVal(gate.id, 'I1');
            const i2 = getPinVal(gate.id, 'I2');
            const i3 = getPinVal(gate.id, 'I3');
            const s0 = getPinVal(gate.id, 'S0');
            const s1 = getPinVal(gate.id, 'S1');
            if (s0 === 'X' || s1 === 'X' || s0 === 'Z' || s1 === 'Z') {
              pinValues[`${gate.id}:Z`] = 'X';
            } else {
              const sel = (s1 * 2) + s0;
              pinValues[`${gate.id}:Z`] = [i0, i1, i2, i3][sel];
            }
            break;
          }
          case 'DEMUX2': {
            const inp = getPinVal(gate.id, 'IN');
            const sel = getPinVal(gate.id, 'SEL');
            if (sel === 0) {
              pinValues[`${gate.id}:Y0`] = inp;
              pinValues[`${gate.id}:Y1`] = 0;
            } else if (sel === 1) {
              pinValues[`${gate.id}:Y0`] = 0;
              pinValues[`${gate.id}:Y1`] = inp;
            } else {
              pinValues[`${gate.id}:Y0`] = 'X';
              pinValues[`${gate.id}:Y1`] = 'X';
            }
            break;
          }
          case 'DEC38': {
            const a0 = getPinVal(gate.id, 'A0');
            const a1 = getPinVal(gate.id, 'A1');
            const a2 = getPinVal(gate.id, 'A2');
            if (a0 === 'X' || a1 === 'X' || a2 === 'X') {
              for (let i = 0; i < 8; i++) pinValues[`${gate.id}:Y${i}`] = 'X';
            } else {
              const code = (Number(a2) << 2) | (Number(a1) << 1) | Number(a0);
              for (let i = 0; i < 8; i++) {
                pinValues[`${gate.id}:Y${i}`] = i === code ? 1 : 0;
              }
            }
            break;
          }
          case 'ADDER4': {
            let a = 0, b = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `A${i}`) === 1) a |= (1 << i);
              if (getPinVal(gate.id, `B${i}`) === 1) b |= (1 << i);
            }
            const ci = getPinVal(gate.id, 'CI') === 1 ? 1 : 0;
            const sum = a + b + ci;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:S${i}`] = (sum & (1 << i)) ? 1 : 0;
            }
            pinValues[`${gate.id}:CO`] = sum >= 16 ? 1 : 0;
            break;
          }
          case 'SUB4': {
            let a = 0, b = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `A${i}`) === 1) a |= (1 << i);
              if (getPinVal(gate.id, `B${i}`) === 1) b |= (1 << i);
            }
            const bi = getPinVal(gate.id, 'BI') === 1 ? 1 : 0;
            let diff = a - b - bi;
            const borrowOut = diff < 0 ? 1 : 0;
            if (diff < 0) diff += 16;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:D${i}`] = (diff & (1 << i)) ? 1 : 0;
            }
            pinValues[`${gate.id}:BO`] = borrowOut;
            break;
          }
          case 'COMP4': {
            let a = 0, b = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `A${i}`) === 1) a |= (1 << i);
              if (getPinVal(gate.id, `B${i}`) === 1) b |= (1 << i);
            }
            pinValues[`${gate.id}:GT`] = a > b ? 1 : 0;
            pinValues[`${gate.id}:EQ`] = a === b ? 1 : 0;
            pinValues[`${gate.id}:LT`] = a < b ? 1 : 0;
            break;
          }
          case 'DFF': {
            const clk = getPinVal(gate.id, 'CLK');
            const clr = getPinVal(gate.id, 'CLR');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            let q = evaluateLogicVal(gate.state.val ?? 0);

            if (clr === 1) {
              q = 0;
            } else if (prevClk === 0 && clk === 1) { // Rising edge
              const d = getPinVal(gate.id, 'D');
              q = d;
            }
            gate.state.val = q;
            pinValues[`${gate.id}:Q`] = q;
            pinValues[`${gate.id}:~Q`] = logicNot(q);
            break;
          }
          case 'JKFF': {
            const clk = getPinVal(gate.id, 'CLK');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            let q = evaluateLogicVal(gate.state.val ?? 0);

            if (prevClk === 0 && clk === 1) {
              const j = getPinVal(gate.id, 'J');
              const k = getPinVal(gate.id, 'K');
              if (j === 0 && k === 0) {
                // No change
              } else if (j === 1 && k === 0) {
                q = 1;
              } else if (j === 0 && k === 1) {
                q = 0;
              } else if (j === 1 && k === 1) {
                q = logicNot(q);
              }
            }
            gate.state.val = q;
            pinValues[`${gate.id}:Q`] = q;
            pinValues[`${gate.id}:~Q`] = logicNot(q);
            break;
          }
          case 'TFF': {
            const clk = getPinVal(gate.id, 'CLK');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            let q = evaluateLogicVal(gate.state.val ?? 0);
            if (prevClk === 0 && clk === 1) {
              const t = getPinVal(gate.id, 'T');
              if (t === 1) q = logicNot(q);
            }
            gate.state.val = q;
            pinValues[`${gate.id}:Q`] = q;
            pinValues[`${gate.id}:~Q`] = logicNot(q);
            break;
          }
          case 'LATCH': {
            const s = getPinVal(gate.id, 'S');
            const r = getPinVal(gate.id, 'R');
            let q = evaluateLogicVal(gate.state.val ?? 0);
            if (s === 1 && r === 0) q = 1;
            else if (s === 0 && r === 1) q = 0;
            else if (s === 1 && r === 1) q = 'X';
            gate.state.val = q;
            pinValues[`${gate.id}:Q`] = q;
            pinValues[`${gate.id}:~Q`] = logicNot(q);
            break;
          }
          case 'REG4': {
            const clk = getPinVal(gate.id, 'CLK');
            const load = getPinVal(gate.id, 'LOAD');
            const clr = getPinVal(gate.id, 'CLR');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            let regVal = Number(gate.state.val ?? 0);

            if (clr === 1) {
              regVal = 0;
            } else if (prevClk === 0 && clk === 1) {
              if (load === 1) {
                let d = 0;
                for (let i = 0; i < 4; i++) {
                  if (getPinVal(gate.id, `D${i}`) === 1) d |= (1 << i);
                }
                regVal = d;
              }
            }
            gate.state.val = regVal;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:Q${i}`] = (regVal & (1 << i)) ? 1 : 0;
            }
            break;
          }
          case 'COUNTER4': {
            const clk = getPinVal(gate.id, 'CLK');
            const clr = getPinVal(gate.id, 'CLR');
            const en = getPinVal(gate.id, 'EN');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            let count = Number(gate.state.val ?? 0);

            if (clr === 1) {
              count = 0;
            } else if (prevClk === 0 && clk === 1) {
              if (en !== 0) {
                count = (count + 1) & 0x0F;
              }
            }
            gate.state.val = count;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:Q${i}`] = (count & (1 << i)) ? 1 : 0;
            }
            pinValues[`${gate.id}:RCO`] = count === 15 ? 1 : 0;
            break;
          }
          case 'RAM16x8': {
            const clk = getPinVal(gate.id, 'CLK');
            const we = getPinVal(gate.id, 'WE');
            const cs = getPinVal(gate.id, 'CS');
            const prevClk = this.prevClkStates[gate.id] ?? 0;
            if (!gate.state.memory) {
              gate.state.memory = new Array(16).fill(0);
            }

            let addr = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `A${i}`) === 1) addr |= (1 << i);
            }

            if (cs !== 0 && we === 1 && prevClk === 0 && clk === 1) {
              let di = 0;
              for (let i = 0; i < 4; i++) {
                if (getPinVal(gate.id, `DI${i}`) === 1) di |= (1 << i);
              }
              gate.state.memory[addr] = di;
            }

            const dataOut = gate.state.memory[addr] ?? 0;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:DO${i}`] = (dataOut & (1 << i)) ? 1 : 0;
            }
            break;
          }
          case 'ROM16x8': {
            const oe = getPinVal(gate.id, 'OE');
            if (!gate.state.memory) {
              gate.state.memory = [0x5, 0xA, 0x3, 0xF, 0x1, 0x9, 0xC, 0x7, 0x2, 0x8, 0x4, 0xB, 0xE, 0xD, 0x6, 0x0];
            }
            let addr = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `A${i}`) === 1) addr |= (1 << i);
            }
            const data = gate.state.memory[addr] ?? 0;
            for (let i = 0; i < 4; i++) {
              pinValues[`${gate.id}:D${i}`] = (oe !== 0) ? ((data & (1 << i)) ? 1 : 0) : 'Z';
            }
            break;
          }
          case 'LED': {
            gate.state.val = getPinVal(gate.id, 'IN');
            break;
          }
          case 'SEVEN_SEG':
          case 'HEX_DISP': {
            let nibble = 0;
            for (let i = 0; i < 4; i++) {
              if (getPinVal(gate.id, `D${i}`) === 1) nibble |= (1 << i);
            }
            gate.state.val = nibble;
            break;
          }
          case 'TTY': {
            const strb = getPinVal(gate.id, 'STRB');
            const prevStrb = this.prevClkStates[`${gate.id}:STRB`] ?? 0;
            if (prevStrb === 0 && strb === 1) {
              let charCode = 0;
              for (let i = 0; i < 5; i++) {
                if (getPinVal(gate.id, `D${i}`) === 1) charCode |= (1 << i);
              }
              // Map 5-bit code or char code to ASCII (e.g. 65 = 'A')
              const char = charCode > 0 ? String.fromCharCode(64 + charCode) : ' ';
              gate.state.ttyText = (gate.state.ttyText || '') + char;
              if (gate.state.ttyText.length > 80) {
                gate.state.ttyText = gate.state.ttyText.slice(-80);
              }
            }
            this.prevClkStates[`${gate.id}:STRB`] = strb;
            break;
          }
        }
      }

      // Propagate results of gate evaluation onto connecting wires
      for (const wire of nextCircuit.wires) {
        const srcKey = `${wire.fromGateId}:${wire.fromPinId}`;
        if (srcKey in pinValues) {
          wire.state = pinValues[srcKey];
        }
      }
    }

    // Save previous clock/edge states
    for (const gate of nextCircuit.gates) {
      if (['DFF', 'JKFF', 'TFF', 'REG4', 'COUNTER4', 'RAM16x8'].includes(gate.type)) {
        this.prevClkStates[gate.id] = getPinVal(gate.id, 'CLK');
      }
    }

    // Record waveform history for wires
    for (const wire of nextCircuit.wires) {
      if (!this.waveformHistory[wire.id]) {
        this.waveformHistory[wire.id] = [];
      }
      const list = this.waveformHistory[wire.id];
      list.push({
        timeNs: nextCircuit.timeNs,
        value: wire.state,
      });
      if (list.length > this.maxHistorySamples) {
        list.shift();
      }
    }

    return nextCircuit;
  }

  public getHistory(wireId: string): WaveformSample[] {
    return this.waveformHistory[wireId] || [];
  }
}
