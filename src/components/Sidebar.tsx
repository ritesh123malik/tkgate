import React, { useState } from 'react';
import { GateType, GateCategory, Circuit } from '../types/circuit';
import { GATE_CATALOG } from '../simulator/definitions';
import { UiTheme, THEMES } from '../types/theme';
import {
  Search,
  Cpu,
  Layers,
  Network,
  Activity,
  Plus,
  FolderTree
} from 'lucide-react';

interface SidebarProps {
  theme: UiTheme;
  circuit: Circuit;
  onSelectGateType: (type: GateType) => void;
  pendingGateType: GateType | null;
  onAddProbe: (wireId: string) => void;
  probedWireIds: string[];
}

type MainTab = 'gates' | 'modules' | 'nets';

const GATE_CATEGORIES: { id: GateCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Logic' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'outputs', label: 'Outputs' },
  { id: 'arithmetic', label: 'Arith' },
  { id: 'routing', label: 'Mux/Dec' },
  { id: 'sequential', label: 'Flips/Regs' },
  { id: 'memory', label: 'Memory' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  circuit,
  onSelectGateType,
  pendingGateType,
  onAddProbe,
  probedWireIds,
}) => {
  const [mainTab, setMainTab] = useState<MainTab>('gates');
  const [selectedCategory, setSelectedCategory] = useState<GateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isClassic = theme === 'classic';
  const colors = THEMES[theme];

  const sidebarBg = isClassic ? 'bg-[#dcdcd6] text-black border-r border-[#a0a098]' : 'bg-[#181b24] text-slate-200 border-r border-[#2d3444]';
  const activeTabStyle = isClassic ? 'bg-[#e6e6e0] text-[#000080] font-bold border-b-2 border-[#000080]' : 'bg-[#1e222b] text-blue-400 font-semibold border-b-2 border-blue-500';
  const inactiveTabStyle = isClassic ? 'text-slate-600 hover:text-black' : 'text-slate-400 hover:text-white';

  const gatesList = Object.values(GATE_CATALOG).filter(meta => {
    const matchesCategory = selectedCategory === 'all' || meta.category === selectedCategory;
    const matchesQuery =
      meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className={`w-72 flex flex-col h-full select-none z-10 font-mono text-xs ${sidebarBg}`}>
      {/* Authentic TkGate Sidebar Tabs */}
      <div className={`flex border-b text-[11px] ${isClassic ? 'border-[#a0a098] bg-[#cfcfc8]' : 'border-[#2d3444] bg-[#14161f]'}`}>
        <button
          onClick={() => setMainTab('gates')}
          className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 transition ${mainTab === 'gates' ? activeTabStyle : inactiveTabStyle}`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Gates</span>
        </button>
        <button
          onClick={() => setMainTab('modules')}
          className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 transition ${mainTab === 'modules' ? activeTabStyle : inactiveTabStyle}`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Modules</span>
        </button>
        <button
          onClick={() => setMainTab('nets')}
          className={`flex-1 py-1.5 flex items-center justify-center space-x-1.5 transition ${mainTab === 'nets' ? activeTabStyle : inactiveTabStyle}`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Nets</span>
        </button>
      </div>

      {/* Tab 1: Gates Palette */}
      {mainTab === 'gates' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Header */}
          <div className="p-2 border-b border-inherit">
            <div className="relative">
              <Search className="w-3.5 h-3.5 opacity-50 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search gates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full rounded pl-8 pr-2 py-1 text-xs focus:outline-none ${
                  isClassic
                    ? 'bg-white border border-[#999990] text-black'
                    : 'bg-[#12141c] border border-[#333d4e] text-slate-200 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Subcategories */}
          <div className="flex px-2 py-1 overflow-x-auto space-x-1 border-b border-inherit scrollbar-none">
            {GATE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? (isClassic ? 'bg-[#000080] text-white font-bold' : 'bg-blue-600 text-white font-semibold')
                    : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gates List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {gatesList.map(meta => {
              const isSelected = pendingGateType === meta.type;
              return (
                <div
                  key={meta.type}
                  onClick={() => onSelectGateType(meta.type)}
                  className={`p-2 rounded border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? (isClassic ? 'bg-[#000080]/10 border-[#000080]' : 'bg-blue-900/40 border-blue-500')
                      : (isClassic ? 'bg-[#eaeae4] border-[#b0b0a8] hover:bg-white' : 'bg-[#1e222b] border-[#2d3444] hover:bg-[#252b36]')
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-xs ${
                      isClassic ? 'bg-white border-[#999990] text-[#000080]' : 'bg-[#14161f] border-[#3d4455] text-blue-400'
                    }`}>
                      {meta.label}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{meta.name}</div>
                      <div className="text-[10px] opacity-60">
                        {meta.inputs.length} in • {meta.outputs.length} out
                      </div>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Module Hierarchy */}
      {mainTab === 'modules' && (
        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-60">Module Hierarchy</div>
          <div className={`p-2.5 rounded border space-y-2 ${isClassic ? 'bg-[#eaeae4] border-[#b0b0a8]' : 'bg-[#1e222b] border-[#2d3444]'}`}>
            <div className="flex items-center space-x-2 text-blue-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>module main (root)</span>
            </div>
            <div className="pl-4 space-y-1 text-[11px] opacity-80">
              <div>• Total Gates: <span className="font-bold">{circuit.gates.length}</span></div>
              <div>• Total Nets: <span className="font-bold">{circuit.wires.length}</span></div>
              <div>• Timescale: 1ns / 1ns</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Nets & Signals */}
      {mainTab === 'nets' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-inherit text-[10px] font-bold uppercase tracking-wider opacity-60">
            Nets & Signal Probes ({circuit.wires.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {circuit.wires.map(wire => {
              const isProbed = probedWireIds.includes(wire.id);
              let valCol = '#64748b';
              if (wire.state === 1) valCol = '#10b981';
              else if (wire.state === 'Z') valCol = '#f59e0b';
              else if (wire.state === 'X') valCol = '#ef4444';

              return (
                <div
                  key={wire.id}
                  className={`p-2 rounded border flex items-center justify-between text-[11px] ${
                    isClassic ? 'bg-[#eaeae4] border-[#b0b0a8]' : 'bg-[#1e222b] border-[#2d3444]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{wire.name || wire.id}</div>
                    <div className="text-[10px]" style={{ color: valCol }}>
                      State: <strong>{wire.state}</strong> (/{wire.busWidth})
                    </div>
                  </div>
                  <button
                    onClick={() => onAddProbe(wire.id)}
                    className={`p-1 rounded text-[10px] flex items-center space-x-1 ${
                      isProbed
                        ? 'bg-emerald-600 text-white'
                        : (isClassic ? 'bg-[#d0d0c8] hover:bg-white text-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300')
                    }`}
                    title={isProbed ? 'Remove Scope Probe' : 'Add to Scope Probe'}
                  >
                    <Activity className="w-3 h-3" />
                    <span>{isProbed ? 'Probed' : 'Probe'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`p-2 border-t border-inherit text-[10px] flex justify-between opacity-70 ${isClassic ? 'bg-[#cfcfc8]' : 'bg-[#14161f]'}`}>
        <span>TkGate CAD Library</span>
        <span>GPL-2.0</span>
      </div>
    </div>
  );
};
