import React, { useState } from 'react';
import { Gate } from '../types/circuit';
import { Database, X, Check } from 'lucide-react';

interface MemoryEditorModalProps {
  gate: Gate | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMemory: (gateId: string, memory: number[]) => void;
}

export const MemoryEditorModal: React.FC<MemoryEditorModalProps> = ({
  gate,
  isOpen,
  onClose,
  onSaveMemory,
}) => {
  if (!isOpen || !gate || !['RAM16x8', 'ROM16x8'].includes(gate.type)) return null;

  const currentMem = gate.state.memory || new Array(16).fill(0);
  const [memData, setMemData] = useState<number[]>([...currentMem]);

  const handleByteChange = (index: number, valStr: string) => {
    const parsed = parseInt(valStr, 16);
    if (!isNaN(parsed)) {
      const updated = [...memData];
      updated[index] = Math.min(255, Math.max(0, parsed));
      setMemData(updated);
    }
  };

  const handleSave = () => {
    onSaveMemory(gate.id, memData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e222b] border border-[#3d4455] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d4455] bg-[#242936]">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                {gate.name} — Hex Memory Editor
              </h2>
              <p className="text-xs text-slate-400">
                16 Bytes x 8-Bit Address Space (0x0 to 0xF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hex Grid */}
        <div className="p-6 bg-[#161922] grid grid-cols-4 gap-3 max-h-80 overflow-y-auto font-mono text-xs">
          {memData.map((val, idx) => (
            <div
              key={idx}
              className="bg-[#1e2433] border border-[#334155] rounded p-2 flex flex-col space-y-1 focus-within:border-blue-500 transition"
            >
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0x{idx.toString(16).toUpperCase()}</span>
                <span className="text-emerald-400">{val.toString(2).padStart(8, '0')}</span>
              </div>
              <input
                type="text"
                maxLength={2}
                value={val.toString(16).toUpperCase().padStart(2, '0')}
                onChange={e => handleByteChange(idx, e.target.value)}
                className="w-full bg-[#0f172a] text-center text-amber-400 font-bold border border-slate-700 rounded py-1 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-3 bg-[#1e222b] border-t border-[#3d4455]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Memory Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
