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
  RotateCw,
  Sun,
  Moon,
  Pencil,
  Clock,
  Sliders
} from 'lucide-react';
import { UiTheme } from '../types/theme';
import { EXAMPLES } from '../examples/circuits';

interface ToolbarProps {
  theme: UiTheme;
  onSetTheme: (theme: UiTheme) => void;
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
  onRotate: () => void;
  simTimeNs: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  theme,
  onSetTheme,
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
  onRotate,
  simTimeNs,
}) => {
  const isClassic = theme === 'classic';

  const tbContainerStyle = isClassic
    ? 'bg-[#e6e6e0] text-black border-b border-[#a0a098]'
    : 'bg-[#1a1e28] text-slate-200 border-b border-[#2d3444]';

  const btnStyle = (active: boolean = false) => {
    if (isClassic) {
      return active
        ? 'bg-[#c0c0b8] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white text-black'
        : 'bg-[#e6e6e0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] hover:bg-[#efefe9] text-black';
    }
    return active
      ? 'bg-blue-600 text-white'
      : 'bg-[#14161f] border border-[#333d4e] hover:bg-slate-700 text-slate-300';
  };

  return (
    <div className={`h-11 px-3 flex items-center justify-between select-none z-20 font-mono text-xs ${tbContainerStyle}`}>
      {/* Left: Quick File, Edit & Rotate */}
      <div className="flex items-center space-x-1.5">
        {/* TkGate Logo */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-inherit">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            G
          </div>
          <span className="font-bold text-sm tracking-tight">TkGate</span>
        </div>

        {/* File & Save */}
        <button onClick={onNewCircuit} className={`p-1.5 rounded ${btnStyle()}`} title="New Circuit (Ctrl+N)">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
        </button>
        <button onClick={onLoadCircuit} className={`p-1.5 rounded ${btnStyle()}`} title="Open Circuit (Ctrl+O)">
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
        <button onClick={onSaveCircuit} className={`p-1.5 rounded ${btnStyle()}`} title="Save Circuit (Ctrl+S)">
          <Save className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-inherit opacity-30 mx-1" />

        {/* Tools */}
        <button
          onClick={() => onSelectTool('select')}
          className={`p-1.5 rounded ${btnStyle(activeTool === 'select')}`}
          title="Select / Move Tool (S)"
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSelectTool('wire')}
          className={`p-1.5 rounded ${btnStyle(activeTool === 'wire')}`}
          title="Wire Routing Tool (W)"
        >
          <Cable className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSelectTool('pan')}
          className={`p-1.5 rounded ${btnStyle(activeTool === 'pan')}`}
          title="Pan View Tool (H)"
        >
          <Hand className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onSelectTool('delete')}
          className={`p-1.5 rounded ${btnStyle(activeTool === 'delete')}`}
          title="Delete Tool (D)"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
        <button
          onClick={onRotate}
          className={`p-1.5 rounded ${btnStyle()}`}
          title="Rotate Gate 90° CW (R)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-inherit opacity-30 mx-1" />

        {/* Mode Switcher */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => { if (isRunning) onToggleRun(); }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              !isRunning
                ? (isClassic ? 'bg-[#000080] text-white font-bold' : 'bg-blue-600 text-white')
                : (isClassic ? 'bg-[#d0d0c8] text-black' : 'bg-[#14161f] text-slate-400')
            }`}
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => { if (!isRunning) onToggleRun(); }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              isRunning
                ? (isClassic ? 'bg-[#008b00] text-white font-bold' : 'bg-emerald-600 text-white')
                : (isClassic ? 'bg-[#d0d0c8] text-black' : 'bg-[#14161f] text-slate-400')
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Center: Simulation Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleRun}
          className={`flex items-center space-x-1 px-3 py-1 rounded text-[11px] font-bold shadow-sm transition ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={onStep}
          disabled={isRunning}
          className={`p-1.5 rounded disabled:opacity-40 ${btnStyle()}`}
          title="Step 1 Tick (Tab)"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          className={`p-1.5 rounded ${btnStyle()}`}
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Speed Slider */}
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] ${
          isClassic ? 'bg-white border-[#999990]' : 'bg-[#12141c] border-[#333d4e]'
        }`}>
          <Sliders className="w-3 h-3 opacity-60" />
          <input
            type="range"
            min="1"
            max="100"
            value={simSpeed}
            onChange={e => onChangeSpeed(Number(e.target.value))}
            className="w-14 accent-blue-600 h-1 cursor-pointer"
          />
          <span className="w-7 text-[10px] text-right font-bold">{simSpeed}Hz</span>
        </div>

        {/* Digital Time Indicator */}
        <div className={`px-2 py-1 rounded border font-bold text-[11px] ${
          isClassic ? 'bg-white border-[#999990] text-[#008b00]' : 'bg-[#0f172a] border-[#333d4e] text-emerald-400'
        }`}>
          T = {simTimeNs} ns
        </div>
      </div>

      {/* Right: Auxiliary Tools & Modals */}
      <div className="flex items-center space-x-1.5">
        {/* Example Selector */}
        <select
          onChange={e => {
            if (e.target.value) onLoadExample(e.target.value);
          }}
          defaultValue=""
          className={`rounded px-2 py-1 text-xs focus:outline-none cursor-pointer ${
            isClassic ? 'bg-white border border-[#999990] text-black' : 'bg-[#14161f] border border-[#333d4e] text-slate-200'
          }`}
        >
          <option value="" disabled>Load Example...</option>
          {Object.entries(EXAMPLES).map(([key, ex]) => (
            <option key={key} value={key}>
              {ex.name}
            </option>
          ))}
        </select>

        {/* Scope Toggle */}
        <button
          onClick={onToggleScope}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] transition ${
            isScopeOpen
              ? (isClassic ? 'bg-[#000080] text-white font-bold' : 'bg-blue-600 text-white')
              : btnStyle()
          }`}
          title="Toggle Waveform Scope"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Scope</span>
        </button>

        {/* Verilog Netlist */}
        <button
          onClick={onOpenVerilog}
          className={`flex items-center space-x-1 px-2 py-1 rounded ${btnStyle()}`}
          title="View Verilog Netlist"
        >
          <FileCode className="w-3.5 h-3.5 text-blue-500" />
          <span>Verilog</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => onSetTheme(isClassic ? 'dark' : 'classic')}
          className={`p-1.5 rounded ${btnStyle()}`}
          title={`Switch to ${isClassic ? 'Dark CAD Mode' : 'Classic TkGate X11 Mode'}`}
        >
          {isClassic ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {/* Native Mac App */}
        <button
          onClick={onOpenMacDownload}
          className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white rounded text-[11px] shadow-sm transition"
          title="TkGate Native Mac App"
        >
          <Apple className="w-3.5 h-3.5" />
          <span>Mac App</span>
        </button>
      </div>
    </div>
  );
};
