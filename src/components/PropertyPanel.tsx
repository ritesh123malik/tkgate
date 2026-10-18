import React from 'react';
import { Circuit, Gate, Wire } from '../types/circuit';
import { Sliders, Activity, Trash2, Database } from 'lucide-react';

interface PropertyPanelProps {
  circuit: Circuit;
  selectedGateId: string | null;
  selectedWireId: string | null;
  onUpdateCircuit: (circuit: Circuit) => void;
  onAddProbe: (wireId: string) => void;
  onOpenMemoryEditor: (gate: Gate) => void;
  probedWireIds: string[];
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  circuit,
  selectedGateId,
  selectedWireId,
  onUpdateCircuit,
  onAddProbe,
  onOpenMemoryEditor,
  probedWireIds,
}) => {
  const selectedGate = circuit.gates.find(g => g.id === selectedGateId);
  const selectedWire = circuit.wires.find(w => w.id === selectedWireId);

  if (!selectedGate && !selectedWire) {
    return (
      <div className="w-64 bg-[#1a1e28] border-l border-[#3d4455] p-4 text-xs font-mono text-slate-400 select-none flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-slate-300 font-bold mb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Inspector</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Select a gate or wire on the canvas to inspect its properties, probe signals, or configure parameters.
          </p>
        </div>

        <div className="bg-[#141822] p-3 rounded border border-[#333d4e] space-y-1.5 text-[10px]">
          <div className="text-slate-300 font-bold">Shortcuts:</div>
          <div><code className="text-blue-400">Space</code> : Run / Pause</div>
          <div><code className="text-blue-400">Del / Backspace</code> : Delete</div>
          <div><code className="text-blue-400">W</code> : Wire Tool</div>
          <div><code className="text-blue-400">S</code> : Select Tool</div>
          <div><code className="text-blue-400">R</code> : Rotate Gate</div>
        </div>
      </div>
    );
  }

  // Gate Inspector
  if (selectedGate) {
    return (
      <div className="w-64 bg-[#1a1e28] border-l border-[#3d4455] p-4 text-xs font-mono select-none overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-[#3d4455] pb-2">
          <div className="font-bold text-slate-200">{selectedGate.type}</div>
          <button
            onClick={() => {
              const newGates = circuit.gates.filter(g => g.id !== selectedGate.id);
              const newWires = circuit.wires.filter(w => w.fromGateId !== selectedGate.id && w.toGateId !== selectedGate.id);
              onUpdateCircuit({ ...circuit, gates: newGates, wires: newWires });
            }}
            className="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
            title="Delete Gate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Name input */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase">Label / Name</label>
          <input
            type="text"
            value={selectedGate.name}
            onChange={e => {
              const updated = circuit.gates.map(g =>
                g.id === selectedGate.id ? { ...g, name: e.target.value } : g
              );
              onUpdateCircuit({ ...circuit, gates: updated });
            }}
            className="w-full bg-[#141822] border border-[#3d4455] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Delay input */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase">Propagation Delay (ns)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={selectedGate.delayNs}
            onChange={e => {
              const updated = circuit.gates.map(g =>
                g.id === selectedGate.id ? { ...g, delayNs: Math.max(0, Number(e.target.value)) } : g
              );
              onUpdateCircuit({ ...circuit, gates: updated });
            }}
            className="w-full bg-[#141822] border border-[#3d4455] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Clock frequency */}
        {selectedGate.type === 'CLOCK' && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Frequency (Hz)</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={selectedGate.state.clockFreq || 1}
              onChange={e => {
                const updated = circuit.gates.map(g =>
                  g.id === selectedGate.id ? { ...g, state: { ...g.state, clockFreq: Math.max(1, Number(e.target.value)) } } : g
                );
                onUpdateCircuit({ ...circuit, gates: updated });
              }}
              className="w-full bg-[#141822] border border-[#3d4455] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Memory Hex Editor Button */}
        {['RAM16x8', 'ROM16x8'].includes(selectedGate.type) && (
          <button
            onClick={() => onOpenMemoryEditor(selectedGate)}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-blue-300 rounded font-semibold transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open Hex Memory Editor</span>
          </button>
        )}

        {/* Comment Text */}
        {selectedGate.type === 'COMMENT' && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase">Annotation Text</label>
            <textarea
              rows={3}
              value={selectedGate.state.commentText || selectedGate.name}
              onChange={e => {
                const updated = circuit.gates.map(g =>
                  g.id === selectedGate.id ? { ...g, state: { ...g.state, commentText: e.target.value }, name: e.target.value } : g
                );
                onUpdateCircuit({ ...circuit, gates: updated });
              }}
              className="w-full bg-[#141822] border border-[#3d4455] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Pins list */}
        <div className="space-y-2 pt-2 border-t border-[#3d4455]">
          <div className="text-[10px] text-slate-400 uppercase">Gate Pins</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {[...selectedGate.inputs, ...selectedGate.outputs].map(pin => (
              <div key={pin.id} className="flex justify-between items-center text-[11px] bg-[#141822] p-1.5 rounded">
                <span className="text-slate-300">{pin.name}</span>
                <span className="text-[10px] text-slate-500 uppercase">{pin.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Wire Inspector
  if (selectedWire) {
    const isProbed = probedWireIds.includes(selectedWire.id);
    let valColor = '#64748b';
    if (selectedWire.state === 1) valColor = '#10b981';
    else if (selectedWire.state === 'Z') valColor = '#f59e0b';
    else if (selectedWire.state === 'X') valColor = '#ef4444';

    return (
      <div className="w-64 bg-[#1a1e28] border-l border-[#3d4455] p-4 text-xs font-mono select-none space-y-4">
        <div className="flex items-center justify-between border-b border-[#3d4455] pb-2">
          <div className="font-bold text-slate-200">Wire / Net</div>
          <button
            onClick={() => {
              const newWires = circuit.wires.filter(w => w.id !== selectedWire.id);
              onUpdateCircuit({ ...circuit, wires: newWires });
            }}
            className="text-red-400 hover:text-red-300 p-1 hover:bg-slate-800 rounded transition"
            title="Delete Wire"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wire Name */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase">Wire Label</label>
          <input
            type="text"
            value={selectedWire.name || selectedWire.id}
            onChange={e => {
              const updated = circuit.wires.map(w =>
                w.id === selectedWire.id ? { ...w, name: e.target.value } : w
              );
              onUpdateCircuit({ ...circuit, wires: updated });
            }}
            className="w-full bg-[#141822] border border-[#3d4455] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Wire Live State */}
        <div className="bg-[#141822] p-3 rounded border border-[#333d4e] flex justify-between items-center">
          <span className="text-slate-400">Current Signal:</span>
          <span className="font-bold text-sm" style={{ color: valColor }}>
            {selectedWire.state}
          </span>
        </div>

        {/* Probe Toggle */}
        <button
          onClick={() => onAddProbe(selectedWire.id)}
          className={`w-full flex items-center justify-center space-x-2 py-2 rounded font-semibold transition border ${
            isProbed
              ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isProbed ? 'Remove from Scope' : 'Add to Scope Probe'}</span>
        </button>
      </div>
    );
  }

  return null;
};
