import React, { useState, useRef, useEffect } from 'react';
import { UiTheme } from '../types/theme';
import { EXAMPLES } from '../examples/circuits';

interface MenuBarProps {
  theme: UiTheme;
  onSetTheme: (theme: UiTheme) => void;
  onNewCircuit: () => void;
  onSaveCircuit: () => void;
  onLoadCircuit: () => void;
  onLoadExample: (key: string) => void;
  onExportVerilog: () => void;
  onExportSvg: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onRotateSelected: () => void;
  onToggleScope: () => void;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onOpenProperties: () => void;
  onOpenMacDownload: () => void;
  isSimulating: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  theme,
  onSetTheme,
  onNewCircuit,
  onSaveCircuit,
  onLoadCircuit,
  onLoadExample,
  onExportVerilog,
  onExportSvg,
  onUndo,
  onRedo,
  onDeleteSelected,
  onSelectAll,
  onRotateSelected,
  onToggleScope,
  onToggleRun,
  onStep,
  onReset,
  onOpenProperties,
  onOpenMacDownload,
  isSimulating,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMenuClick = (name: string) => {
    setActiveMenu(current => (current === name ? null : name));
  };

  const isClassic = theme === 'classic';

  const menuStyle = isClassic
    ? 'bg-[#d6d6d0] text-black border-b border-[#a0a098]'
    : 'bg-[#181b24] text-slate-200 border-b border-[#2d3444]';

  const itemHoverStyle = isClassic
    ? 'hover:bg-[#000080] hover:text-white'
    : 'hover:bg-blue-600 hover:text-white';

  const dropdownStyle = isClassic
    ? 'bg-[#e6e6e0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] shadow-md text-black'
    : 'bg-[#1e222b] border border-[#3d4455] shadow-2xl text-slate-200';

  return (
    <div ref={menuBarRef} className={`h-6 flex items-center px-2 select-none text-[11px] font-mono relative z-40 ${menuStyle}`}>
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('file')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'file' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className={`absolute left-0 top-full mt-0.5 w-56 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onNewCircuit(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>New Circuit</span>
              <span className="text-[10px] opacity-60">Ctrl+N</span>
            </button>
            <button onClick={() => { onLoadCircuit(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Open Circuit...</span>
              <span className="text-[10px] opacity-60">Ctrl+O</span>
            </button>
            <button onClick={() => { onSaveCircuit(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Save Circuit (JSON)</span>
              <span className="text-[10px] opacity-60">Ctrl+S</span>
            </button>
            <div className="border-t my-1 opacity-20 border-current" />
            <div className="px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-60">Classic TkGate Examples</div>
            {Object.entries(EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => { onLoadExample(key); setActiveMenu(null); }}
                className={`w-full text-left px-3 py-1 text-[10px] truncate ${itemHoverStyle}`}
              >
                {ex.name}
              </button>
            ))}
            <div className="border-t my-1 opacity-20 border-current" />
            <button onClick={() => { onExportVerilog(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Export Verilog (.v)...</span>
            </button>
            <button onClick={() => { onExportSvg(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Export Image (PNG)...</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('edit')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'edit' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className={`absolute left-0 top-full mt-0.5 w-48 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onUndo(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Undo</span>
              <span className="text-[10px] opacity-60">Ctrl+Z</span>
            </button>
            <button onClick={() => { onRedo(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Redo</span>
              <span className="text-[10px] opacity-60">Ctrl+Y</span>
            </button>
            <div className="border-t my-1 opacity-20 border-current" />
            <button onClick={() => { onRotateSelected(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Rotate 90° CW</span>
              <span className="text-[10px] opacity-60">R</span>
            </button>
            <button onClick={() => { onDeleteSelected(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Delete Selected</span>
              <span className="text-[10px] opacity-60">Del</span>
            </button>
            <button onClick={() => { onSelectAll(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Select All</span>
              <span className="text-[10px] opacity-60">Ctrl+A</span>
            </button>
            <div className="border-t my-1 opacity-20 border-current" />
            <button onClick={() => { onOpenProperties(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Gate Properties...</span>
            </button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('view')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'view' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className={`absolute left-0 top-full mt-0.5 w-52 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onToggleScope(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Waveform Scope</span>
              <span className="text-[10px] opacity-60">Ctrl+W</span>
            </button>
            <div className="border-t my-1 opacity-20 border-current" />
            <button
              onClick={() => { onSetTheme(isClassic ? 'dark' : 'classic'); setActiveMenu(null); }}
              className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}
            >
              <span>Theme: {isClassic ? 'Classic TkGate (X11)' : 'Modern CAD (Dark)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Simulate Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('simulate')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'simulate' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          Simulate
        </button>
        {activeMenu === 'simulate' && (
          <div className={`absolute left-0 top-full mt-0.5 w-52 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onToggleRun(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>{isSimulating ? 'Pause Simulation' : 'Run Simulation'}</span>
              <span className="text-[10px] opacity-60">Space</span>
            </button>
            <button onClick={() => { onStep(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Step 1 Tick</span>
              <span className="text-[10px] opacity-60">Tab</span>
            </button>
            <button onClick={() => { onReset(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 flex justify-between ${itemHoverStyle}`}>
              <span>Reset State</span>
            </button>
          </div>
        )}
      </div>

      {/* Scope Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('scope')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'scope' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          Scope
        </button>
        {activeMenu === 'scope' && (
          <div className={`absolute left-0 top-full mt-0.5 w-48 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onToggleScope(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 ${itemHoverStyle}`}>
              <span>Toggle Logic Analyzer</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('help')}
          className={`px-2.5 py-0.5 rounded-sm transition ${activeMenu === 'help' ? (isClassic ? 'bg-[#000080] text-white' : 'bg-blue-600 text-white') : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className={`absolute left-0 top-full mt-0.5 w-60 py-1 z-50 ${dropdownStyle}`}>
            <button onClick={() => { onOpenMacDownload(); setActiveMenu(null); }} className={`w-full text-left px-3 py-1 ${itemHoverStyle}`}>
              <span>macOS Native App & CLI...</span>
            </button>
            <div className="border-t my-1 opacity-20 border-current" />
            <button
              onClick={() => {
                alert('TkGate 2.0 Digital Circuit Simulator\nOriginally written by Jeffery P. Hansen\nWeb Port with React, TypeScript & Canvas Engine.');
                setActiveMenu(null);
              }}
              className={`w-full text-left px-3 py-1 ${itemHoverStyle}`}
            >
              <span>About TkGate Web</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
