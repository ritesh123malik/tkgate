import React, { useState } from 'react';
import { Gate, Circuit } from '../types/circuit';
import { Settings, X, Check } from 'lucide-react';

interface GatePropertiesModalProps {
  gate: Gate | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveGate: (updatedGate: Gate) => void;
}

export const GatePropertiesModal: React.FC<GatePropertiesModalProps> = ({
  gate,
  isOpen,
  onClose,
  onSaveGate,
}) => {
  if (!isOpen || !gate) return null;

  const [name, setName] = useState(gate.name);
  const [delayNs, setDelayNs] = useState(gate.delayNs);
  const [commentText, setCommentText] = useState(gate.state.commentText || '');
  const [clockFreq, setClockFreq] = useState(gate.state.clockFreq || 1);

  const handleApply = () => {
    onSaveGate({
      ...gate,
      name,
      delayNs: Math.max(0, Number(delayNs)),
      state: {
        ...gate.state,
        commentText,
        clockFreq: Math.max(1, Number(clockFreq)),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e222b] border border-[#3d4455] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#3d4455] bg-[#242936]">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-100">
              TkGate Properties: {gate.name} ({gate.type})
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 space-y-4 bg-[#161922]">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Gate Label / Instance Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#3d4455] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Gate Type (Builtin Primitives)</label>
            <input
              type="text"
              readOnly
              value={gate.type}
              className="w-full bg-[#1e2433] border border-[#333d4e] rounded px-3 py-1.5 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Propagation Delay (ns)</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={delayNs}
              onChange={e => setDelayNs(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-[#3d4455] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {gate.type === 'CLOCK' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Clock Frequency (Hz)</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={clockFreq}
                onChange={e => setClockFreq(Number(e.target.value))}
                className="w-full bg-[#0f172a] border border-[#3d4455] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {gate.type === 'COMMENT' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">Annotation Notes</label>
              <textarea
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#3d4455] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="bg-[#1e2433] p-3 rounded border border-[#333d4e] space-y-1 text-[11px] text-slate-400">
            <div><span className="text-slate-500">Position:</span> X: {Math.round(gate.x)}, Y: {Math.round(gate.y)}</div>
            <div><span className="text-slate-500">Inputs:</span> {gate.inputs.length} pins</div>
            <div><span className="text-slate-500">Outputs:</span> {gate.outputs.length} pins</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3 bg-[#1e222b] border-t border-[#3d4455]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
