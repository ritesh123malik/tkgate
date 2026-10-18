import React, { useState } from 'react';
import { GateType, GateCategory } from '../types/circuit';
import { GATE_CATALOG, GateMeta } from '../simulator/definitions';
import {
  Search,
  Cpu,
  ToggleLeft,
  Lightbulb,
  Calculator,
  GitFork,
  Clock,
  Database,
  Type,
  Plus
} from 'lucide-react';

interface SidebarProps {
  onSelectGateType: (type: GateType) => void;
  pendingGateType: GateType | null;
}

const CATEGORIES: { id: GateCategory | 'all'; label: string; icon: React.FC<any> }[] = [
  { id: 'all', label: 'All Gates', icon: Cpu },
  { id: 'basic', label: 'Logic Gates', icon: Cpu },
  { id: 'inputs', label: 'Inputs & Clocks', icon: ToggleLeft },
  { id: 'outputs', label: 'Indicators & Displays', icon: Lightbulb },
  { id: 'arithmetic', label: 'Arithmetic / ALU', icon: Calculator },
  { id: 'routing', label: 'Mux & Decoders', icon: GitFork },
  { id: 'sequential', label: 'Flip-Flops & Regs', icon: Clock },
  { id: 'memory', label: 'RAM / ROM', icon: Database },
];

export const Sidebar: React.FC<SidebarProps> = ({ onSelectGateType, pendingGateType }) => {
  const [selectedCategory, setSelectedCategory] = useState<GateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const gatesList = Object.values(GATE_CATALOG).filter(meta => {
    const matchesCategory = selectedCategory === 'all' || meta.category === selectedCategory;
    const matchesQuery =
      meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="w-72 bg-[#1a1e28] border-r border-[#3d4455] flex flex-col h-full select-none z-10">
      {/* Search Header */}
      <div className="p-3 border-b border-[#3d4455]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search gates & chips..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#141822] border border-[#3d4455] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex px-2 py-1.5 overflow-x-auto space-x-1 border-b border-[#3d4455] bg-[#161922] scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Gates Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {gatesList.map(meta => {
          const isSelected = pendingGateType === meta.type;
          return (
            <div
              key={meta.type}
              onClick={() => onSelectGateType(meta.type)}
              className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center justify-between group ${
                isSelected
                  ? 'bg-blue-900/40 border-blue-500 shadow-md'
                  : 'bg-[#202533] border-[#333d4e] hover:border-slate-500 hover:bg-[#252b3b]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded bg-[#161a24] border border-[#3d4455] flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                  {meta.label}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition font-mono">
                    {meta.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {meta.inputs.length} in • {meta.outputs.length} out
                  </div>
                </div>
              </div>

              <div className={`p-1 rounded ${isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                <Plus className="w-4 h-4" />
              </div>
            </div>
          );
        })}

        {gatesList.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No gates found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#3d4455] bg-[#141822] text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Click a gate to place</span>
        <span className="text-emerald-400">TkGate v2.0</span>
      </div>
    </div>
  );
};
