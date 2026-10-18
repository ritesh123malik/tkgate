import { Circuit } from '../types/circuit';

export function circuitToVerilog(circuit: Circuit): string {
  const timestamp = new Date().toISOString();
  let v = `//: version "2.0-web"
//: property title = "${circuit.name || 'tkgate_circuit.v'}"
//: generated = "${timestamp}"
//: generator = "TkGate Web Simulator"

\`timescale 1ns/1ns

//: /netlistBegin main
module main;    //: root_module

`;

  // Collect wires
  const wireNames = new Set<string>();
  circuit.wires.forEach((w, idx) => {
    const name = w.name || `w${idx}`;
    wireNames.add(name);
  });

  if (wireNames.size > 0) {
    v += `  // Interconnecting wires\n`;
    wireNames.forEach(name => {
      v += `  wire ${name};\n`;
    });
    v += `\n`;
  }

  // Gates instantiations
  v += `  // Gate instantiations\n`;
  circuit.gates.forEach((gate, idx) => {
    const gName = gate.name || `g${idx}`;
    const delay = gate.delayNs > 0 ? `#(${gate.delayNs}) ` : '';

    switch (gate.type) {
      case 'AND':
        v += `  _GGAND2 ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}), .I1(w_in1_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'NAND':
        v += `  _GGNAND2 ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}), .I1(w_in1_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'OR':
        v += `  _GGOR2 ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}), .I1(w_in1_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'NOR':
        v += `  _GGNOR2 ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}), .I1(w_in1_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'XOR':
        v += `  _GGXOR2 ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}), .I1(w_in1_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'NOT':
        v += `  _GGNOT ${delay}${gName} (.Z(w_out_${gName}), .I0(w_in0_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'SWITCH':
        v += `  //: SWITCH ${gName} (w_out_${gName}) @(${gate.x},${gate.y}) /st:${gate.state.val ? 1 : 0}\n`;
        break;
      case 'BUTTON':
        v += `  //: BUTTON ${gName} (w_out_${gName}) @(${gate.x},${gate.y})\n`;
        break;
      case 'LED':
        v += `  //: LED ${gName} (w_in0_${gName}) @(${gate.x},${gate.y}) /type:0\n`;
        break;
      case 'CLOCK':
        v += `  _GGCLOCK_P100_0_50 ${gName} (.Z(w_out_${gName}));   //: @(${gate.x},${gate.y}) /omega:${gate.state.clockFreq || 1}\n`;
        break;
      case 'ADDER4':
        v += `  _GGADD4 ${delay}${gName} (.CI(w_ci_${gName}), .CO(w_co_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      case 'DFF':
        v += `  _GGDFF ${delay}${gName} (.CLK(w_clk_${gName}), .D(w_d_${gName}), .Q(w_q_${gName}), .QB(w_qb_${gName}));   //: @(${gate.x},${gate.y})\n`;
        break;
      default:
        v += `  //: ${gate.type} ${gName} @(${gate.x},${gate.y})\n`;
        break;
    }
  });

  v += `\nendmodule\n//: /netlistEnd\n\n`;

  // Standard TkGate Builtin Gate modules
  v += `//: /builtinBegin
module _GGAND2 #(parameter Diz=1) (output Z, input I0, I1);
  assign #Diz Z = (I0 & I1);
endmodule

module _GGNAND2 #(parameter Diz=1) (output Z, input I0, I1);
  assign #Diz Z = ~(I0 & I1);
endmodule

module _GGOR2 #(parameter Diz=1) (output Z, input I0, I1);
  assign #Diz Z = (I0 | I1);
endmodule

module _GGNOR2 #(parameter Diz=1) (output Z, input I0, I1);
  assign #Diz Z = ~(I0 | I1);
endmodule

module _GGXOR2 #(parameter Diz=1) (output Z, input I0, I1);
  assign #Diz Z = (I0 ^ I1);
endmodule

module _GGNOT #(parameter Diz=1) (output Z, input I0);
  assign #Diz Z = ~I0;
endmodule
//: /builtinEnd
`;

  return v;
}
