import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  Activity,
  FileCode,
  FolderOpen,
  Save,
  Trash2,
  Apple,
  MousePointer,
  Cable,
  Hand,
  Sliders
} from 'lucide-react';
import { EXAMPLES } from '../examples/circuits';

interface ToolbarProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  activeTool: 'select' | 'wire' | 'pan' | 'delete';
  onSelectTool: (tool: 'select' | 'wire' | 'pan' | 'delete') => void;
  onLoadExample: (exampleKey: string) => void;
  onOpenVerilog: () => void;
  onToggleScope: () => void;
  isScopeOpen: boolean;
  onOpenMacDownload: () => void;
  onSaveCircuit: () => void;
  onLoadCircuit: () => void;
  onNewCircuit: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRunning,
  onToggleRun,
  onStep,
  onReset,
  simSpeed,
  onChangeSpeed,
  activeTool,
  onSelectTool,
  onLoadExample,
  onOpenVerilog,
  onToggleScope,
  isScopeOpen,
  onOpenMacDownload,
  onSaveCircuit,
  onLoadCircuit,
  onNewCircuit,
}) => {
  return (
    <header className="h-14 bg-[#1e222b] border-b border-[#3d4455] px-4 flex items-center justify-between select-none z-20">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-slate-100 tracking-tight font-mono">TkGate</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-400 border border-blue-700/50">WEB</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Digital Circuit Simulator</div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-[#3d4455] mx-1" />

        {/* Examples Selector Dropdown */}
        <select
          onChange={e => {
            if (e.target.value) onLoadExample(e.target.value);
          }}
          defaultValue=""
          className="bg-[#141822] border border-[#3d4455] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="" disabled>Load Classic Example...</option>
          {Object.entries(EXAMPLES).map(([key, ex]) => (
            <option key={key} value={key}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {/* Center: Tools & Simulation Controls */}
      <div className="flex items-center space-x-2">
        {/* Tool selector */}
        <div className="flex items-center bg-[#141822] p-1 rounded-lg border border-[#3d4455] space-x-1">
          <button
            onClick={() => onSelectTool('select')}
            className={`p-1.5 rounded transition ${activeTool === 'select' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Select & Move (S)"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTool('wire')}
            className={`p-1.5 rounded transition ${activeTool === 'wire' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Draw Wire (W)"
          >
            <Cable className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTool('pan')}
            className={`p-1.5 rounded transition ${activeTool === 'pan' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Pan Canvas (H)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectTool('delete')}
            className={`p-1.5 rounded transition ${activeTool === 'delete' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Delete Tool (D)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-[#3d4455] mx-1" />

        {/* Play / Pause / Step Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onToggleRun}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition shadow-sm ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isRunning ? 'Pause Simulation' : 'Run Simulation'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>

          <button
            onClick={onStep}
            disabled={isRunning}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#141822] hover:bg-slate-800 disabled:opacity-40 border border-[#3d4455] text-slate-300 rounded-lg text-xs font-mono transition"
            title="Advance 1 Step (Space)"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-[#141822] hover:bg-slate-800 border border-[#3d4455] text-slate-300 rounded-lg text-xs transition"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center space-x-2 bg-[#141822] px-2.5 py-1 rounded-lg border border-[#3d4455] text-xs font-mono text-slate-400">
          <Sliders className="w-3.5 h-3.5" />
          <input
            type="range"
            min="1"
            max="100"
            value={simSpeed}
            onChange={e => onChangeSpeed(Number(e.target.value))}
            className="w-16 accent-blue-500 h-1 cursor-pointer"
          />
          <span className="w-8 text-[11px] text-right text-slate-300">{simSpeed}Hz</span>
        </div>
      </div>

      {/* Right: Modals & Actions */}
      <div className="flex items-center space-x-2">
        {/* Waveform Scope Toggle */}
        <button
          onClick={onToggleScope}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border ${
            isScopeOpen
              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
              : 'bg-[#141822] border-[#3d4455] text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle Multi-channel Logic Analyzer Scope"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scope</span>
        </button>

        {/* Verilog Netlist */}
        <button
          onClick={onOpenVerilog}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#141822] hover:bg-slate-800 border border-[#3d4455] text-slate-300 rounded-lg text-xs font-mono transition"
          title="Inspect generated Verilog HDL netlist"
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>Verilog</span>
        </button>

        {/* Save & Load */}
        <button
          onClick={onSaveCircuit}
          className="p-1.5 bg-[#141822] hover:bg-slate-800 border border-[#3d4455] text-slate-300 rounded-lg text-xs transition"
          title="Save Circuit (JSON)"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onLoadCircuit}
          className="p-1.5 bg-[#141822] hover:bg-slate-800 border border-[#3d4455] text-slate-300 rounded-lg text-xs transition"
          title="Load Circuit (JSON)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>

        {/* Native Mac App */}
        <button
          onClick={onOpenMacDownload}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 text-slate-200 rounded-lg text-xs font-mono transition"
          title="TkGate Native App for macOS"
        >
          <Apple className="w-3.5 h-3.5" />
          <span>macOS Port</span>
        </button>
      </div>
    </header>
  );
};
