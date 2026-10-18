import React, { useState } from 'react';
import { Circuit } from '../types/circuit';
import { circuitToVerilog } from '../simulator/verilog';
import { FileCode, Copy, Download, Check, X } from 'lucide-react';

interface VerilogEditorProps {
  circuit: Circuit;
  isOpen: boolean;
  onClose: () => void;
}

export const VerilogEditor: React.FC<VerilogEditorProps> = ({ circuit, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const verilogCode = circuitToVerilog(circuit);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(verilogCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([verilogCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuit.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'circuit'}.v`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e222b] border border-[#3d4455] rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d4455] bg-[#242936]">
          <div className="flex items-center space-x-3">
            <FileCode className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                TkGate Verilog HDL Netlist Viewer
              </h2>
              <p className="text-xs text-slate-400">
                Compatible with standard Verilog simulators and TkGate Verga engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .v</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 p-4 bg-[#141822] overflow-auto font-mono text-xs text-emerald-400 leading-relaxed select-text">
          <pre>{verilogCode}</pre>
        </div>
      </div>
    </div>
  );
};
