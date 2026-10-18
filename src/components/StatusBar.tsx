import React from 'react';
import { UiTheme, THEMES } from '../types/theme';
import { Circuit } from '../types/circuit';

interface StatusBarProps {
  theme: UiTheme;
  circuit: Circuit;
  activeTool: 'select' | 'wire' | 'pan' | 'delete';
  isSimulating: boolean;
  selectedGateId: string | null;
  selectedWireId: string | null;
  cursorPos: { x: number; y: number };
  zoom: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  circuit,
  activeTool,
  isSimulating,
  selectedGateId,
  selectedWireId,
  cursorPos,
  zoom,
}) => {
  const isClassic = theme === 'classic';
  const colors = THEMES[theme];

  const selectedGate = circuit.gates.find(g => g.id === selectedGateId);
  const selectedWire = circuit.wires.find(w => w.id === selectedWireId);

  let selectionText = 'Ready';
  if (selectedGate) {
    selectionText = `Gate: ${selectedGate.type} "${selectedGate.name}" @ (${Math.round(selectedGate.x)}, ${Math.round(selectedGate.y)})`;
  } else if (selectedWire) {
    selectionText = `Wire: "${selectedWire.name || selectedWire.id}" State: ${selectedWire.state} (Width: ${selectedWire.busWidth})`;
  }

  const containerStyle = isClassic
    ? 'bg-[#d6d6d0] text-black border-t border-[#a0a098]'
    : 'bg-[#181b24] text-slate-300 border-t border-[#2d3444]';

  const badgeStyle = isClassic
    ? (isSimulating ? 'bg-[#008b00] text-white font-bold' : 'bg-[#000080] text-white font-bold')
    : (isSimulating ? 'bg-emerald-600 text-white font-semibold' : 'bg-blue-600 text-white font-semibold');

  return (
    <footer className={`h-6 flex items-center justify-between px-3 text-[11px] font-mono select-none ${containerStyle}`}>
      {/* Left: Mode & Tool */}
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${badgeStyle}`}>
          {isSimulating ? 'SIMULATING' : 'EDITING'}
        </span>
        <span className="text-slate-400">
          Tool: <span className="text-slate-200 uppercase font-semibold">{activeTool}</span>
        </span>
        <span className="opacity-30">|</span>
        <span className="truncate max-w-sm text-slate-300">
          {selectionText}
        </span>
      </div>

      {/* Right: Coordinates & Time */}
      <div className="flex items-center space-x-4">
        <span>
          Cursor: <span className="text-slate-200">X: {Math.round(cursorPos.x)}, Y: {Math.round(cursorPos.y)}</span>
        </span>
        <span className="opacity-30">|</span>
        <span>
          Zoom: <span className="text-slate-200">{Math.round(zoom * 100)}%</span>
        </span>
        <span className="opacity-30">|</span>
        <span>
          Sim Time: <span className="text-emerald-400 font-bold">{circuit.timeNs} ns</span>
        </span>
      </div>
    </footer>
  );
};
