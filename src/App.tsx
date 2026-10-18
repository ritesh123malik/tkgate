import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Circuit, Gate, GateType, Wire } from './types/circuit';
import { UiTheme, THEMES } from './types/theme';
import { CircuitSimulator } from './simulator/engine';
import { EXAMPLES } from './examples/circuits';
import { GATE_CATALOG } from './simulator/definitions';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Scope } from './components/Scope';
import { PropertyPanel } from './components/PropertyPanel';
import { StatusBar } from './components/StatusBar';
import { VerilogEditor } from './components/VerilogEditor';
import { MemoryEditorModal } from './components/MemoryEditorModal';
import { MacDownloadModal } from './components/MacDownloadModal';
import { GatePropertiesModal } from './components/GatePropertiesModal';

export const App: React.FC = () => {
  // Theme state: defaults to 'classic' TkGate engineering look!
  const [theme, setTheme] = useState<UiTheme>('classic');

  // Main circuit state (starts with the iconic 4-Bit Counter with 7-Segment Display)
  const [circuit, setCircuit] = useState<Circuit>(EXAMPLES.counter_7seg);

  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Circuit[]>([]);
  const [redoStack, setRedoStack] = useState<Circuit[]>([]);

  // Simulation engine instance
  const simulatorRef = useRef<CircuitSimulator>(new CircuitSimulator());
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(10); // Hz

  // Selection & tool states
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'wire' | 'pan' | 'delete'>('select');
  const [pendingGateType, setPendingGateType] = useState<GateType | null>(null);

  // Canvas reporting
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);

  // Modals & Panels
  const [isScopeOpen, setIsScopeOpen] = useState<boolean>(true);
  const [probedWireIds, setProbedWireIds] = useState<string[]>(['w_clk', 'w_q0', 'w_q1', 'w_q2', 'w_q3']);
  const [isVerilogOpen, setIsVerilogOpen] = useState<boolean>(false);
  const [isMacDownloadOpen, setIsMacDownloadOpen] = useState<boolean>(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [memoryEditingGate, setMemoryEditingGate] = useState<Gate | null>(null);

  // Save state to undo stack before mutation
  const pushUndo = useCallback((c: Circuit) => {
    setUndoStack(prev => [...prev.slice(-20), c]);
    setRedoStack([]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, circuit]);
    setUndoStack(u => u.slice(0, -1));
    setCircuit(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, circuit]);
    setRedoStack(r => r.slice(0, -1));
    setCircuit(next);
  };

  const updateCircuitWithUndo = (newCircuit: Circuit) => {
    pushUndo(circuit);
    setCircuit(newCircuit);
  };

  // Step simulation function
  const stepSimulation = useCallback(() => {
    setCircuit(prev => simulatorRef.current.step(prev, Math.max(1, Math.floor(100 / simSpeed))));
  }, [simSpeed]);

  // Main simulation timer
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.max(10, Math.floor(1000 / simSpeed));
    const timer = setInterval(() => {
      stepSimulation();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isRunning, simSpeed, stepSimulation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning(r => !r);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        stepSimulation();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGateId) {
          pushUndo(circuit);
          setCircuit(prev => ({
            ...prev,
            gates: prev.gates.filter(g => g.id !== selectedGateId),
            wires: prev.wires.filter(w => w.fromGateId !== selectedGateId && w.toGateId !== selectedGateId),
          }));
          setSelectedGateId(null);
        } else if (selectedWireId) {
          pushUndo(circuit);
          setCircuit(prev => ({
            ...prev,
            wires: prev.wires.filter(w => w.id !== selectedWireId),
          }));
          setSelectedWireId(null);
        }
      } else if (e.key.toLowerCase() === 'w') {
        setActiveTool('wire');
      } else if (e.key.toLowerCase() === 's') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'r' && selectedGateId) {
        setCircuit(prev => ({
          ...prev,
          gates: prev.gates.map(g =>
            g.id === selectedGateId
              ? { ...g, rotation: ((g.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
              : g
          ),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGateId, selectedWireId, circuit, pushUndo, stepSimulation]);

  // Place gate on canvas
  const handlePlaceGate = (type: GateType, x: number, y: number) => {
    const meta = GATE_CATALOG[type];
    const newGate: Gate = {
      id: `${type.toLowerCase()}_${Date.now()}`,
      type,
      name: `${meta.label}_${circuit.gates.length + 1}`,
      x,
      y,
      rotation: 0,
      inputs: meta.inputs.map(p => ({ ...p, id: p.name })),
      outputs: meta.outputs.map(p => ({ ...p, id: p.name })),
      delayNs: meta.defaultDelay,
      state: type === 'CLOCK' ? { clockFreq: 1 } : (type === 'SWITCH' ? { val: 0 } : {}),
    };

    pushUndo(circuit);
    setCircuit(prev => ({
      ...prev,
      gates: [...prev.gates, newGate],
    }));
    setPendingGateType(null);
    setSelectedGateId(newGate.id);
  };

  // Toggle wire probe in scope
  const handleToggleProbe = (wireId: string) => {
    setProbedWireIds(prev =>
      prev.includes(wireId) ? prev.filter(id => id !== wireId) : [...prev, wireId]
    );
    if (!isScopeOpen) setIsScopeOpen(true);
  };

  // Load example circuit
  const handleLoadExample = (exampleKey: string) => {
    const ex = EXAMPLES[exampleKey];
    if (ex) {
      pushUndo(circuit);
      simulatorRef.current.reset();
      setCircuit(ex);
      setSelectedGateId(null);
      setSelectedWireId(null);
      const sampleWires = ex.wires.slice(0, 5).map(w => w.id);
      setProbedWireIds(sampleWires);
    }
  };

  // Reset simulation
  const handleResetSimulation = () => {
    simulatorRef.current.reset();
    setCircuit(prev => ({
      ...prev,
      timeNs: 0,
      gates: prev.gates.map(g => ({
        ...g,
        state: { ...g.state, val: 0, clockState: 0 },
      })),
      wires: prev.wires.map(w => ({ ...w, state: 0 })),
    }));
  };

  // Save circuit to JSON file
  const handleSaveCircuit = () => {
    const data = JSON.stringify(circuit, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuit.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'circuit'}.tkgate.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load circuit from JSON file
  const handleLoadCircuit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const loaded = JSON.parse(ev.target?.result as string);
            if (loaded.gates && loaded.wires) {
              pushUndo(circuit);
              simulatorRef.current.reset();
              setCircuit(loaded);
              setSelectedGateId(null);
              setSelectedWireId(null);
            }
          } catch (err) {
            alert('Invalid circuit file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // New clean circuit
  const handleNewCircuit = () => {
    if (confirm('Create new empty circuit? Unsaved changes will be lost.')) {
      pushUndo(circuit);
      simulatorRef.current.reset();
      setCircuit({
        id: `circuit_${Date.now()}`,
        name: 'Untitled Circuit',
        description: 'New TkGate schematic',
        gates: [],
        wires: [],
        timeNs: 0,
      });
      setSelectedGateId(null);
      setSelectedWireId(null);
      setProbedWireIds([]);
    }
  };

  const selectedGate = circuit.gates.find(g => g.id === selectedGateId) || null;

  return (
    <div className={`flex flex-col w-screen h-screen overflow-hidden ${theme === 'classic' ? 'bg-[#d6d6d0]' : 'bg-[#161922]'}`}>
      {/* 1. Classic TkGate System Menu Bar */}
      <MenuBar
        theme={theme}
        onSetTheme={setTheme}
        onNewCircuit={handleNewCircuit}
        onSaveCircuit={handleSaveCircuit}
        onLoadCircuit={handleLoadCircuit}
        onLoadExample={handleLoadExample}
        onExportVerilog={() => setIsVerilogOpen(true)}
        onExportSvg={() => alert('Screenshot captured. You can use standard print or screenshot.')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDeleteSelected={() => {
          if (selectedGateId) {
            setCircuit(prev => ({
              ...prev,
              gates: prev.gates.filter(g => g.id !== selectedGateId),
              wires: prev.wires.filter(w => w.fromGateId !== selectedGateId && w.toGateId !== selectedGateId),
            }));
            setSelectedGateId(null);
          } else if (selectedWireId) {
            setCircuit(prev => ({
              ...prev,
              wires: prev.wires.filter(w => w.id !== selectedWireId),
            }));
            setSelectedWireId(null);
          }
        }}
        onSelectAll={() => {}}
        onRotateSelected={() => {
          if (selectedGateId) {
            setCircuit(prev => ({
              ...prev,
              gates: prev.gates.map(g =>
                g.id === selectedGateId
                  ? { ...g, rotation: ((g.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
                  : g
              ),
            }));
          }
        }}
        onToggleScope={() => setIsScopeOpen(s => !s)}
        onToggleRun={() => setIsRunning(r => !r)}
        onStep={stepSimulation}
        onReset={handleResetSimulation}
        onOpenProperties={() => {
          if (selectedGateId) setIsPropertiesOpen(true);
        }}
        onOpenMacDownload={() => setIsMacDownloadOpen(true)}
        isSimulating={isRunning}
      />

      {/* 2. Top TkGate Toolbar Strip */}
      <Toolbar
        theme={theme}
        onSetTheme={setTheme}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(r => !r)}
        onStep={stepSimulation}
        onReset={handleResetSimulation}
        simSpeed={simSpeed}
        onChangeSpeed={setSimSpeed}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onLoadExample={handleLoadExample}
        onOpenVerilog={() => setIsVerilogOpen(true)}
        onToggleScope={() => setIsScopeOpen(s => !s)}
        isScopeOpen={isScopeOpen}
        onOpenMacDownload={() => setIsMacDownloadOpen(true)}
        onSaveCircuit={handleSaveCircuit}
        onLoadCircuit={handleLoadCircuit}
        onNewCircuit={handleNewCircuit}
        onRotate={() => {
          if (selectedGateId) {
            setCircuit(prev => ({
              ...prev,
              gates: prev.gates.map(g =>
                g.id === selectedGateId
                  ? { ...g, rotation: ((g.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
                  : g
              ),
            }));
          }
        }}
        simTimeNs={circuit.timeNs}
      />

      {/* 3. Main Workspace: Sidebar + Canvas + Property Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Authentic TkGate Sidebar (Gates / Modules / Nets) */}
        <Sidebar
          theme={theme}
          circuit={circuit}
          onSelectGateType={type => setPendingGateType(type)}
          pendingGateType={pendingGateType}
          onAddProbe={handleToggleProbe}
          probedWireIds={probedWireIds}
        />

        {/* Central Canvas Area with Scope */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 relative">
            <Canvas
              theme={theme}
              circuit={circuit}
              onUpdateCircuit={setCircuit}
              selectedGateId={selectedGateId}
              onSelectGate={setSelectedGateId}
              selectedWireId={selectedWireId}
              onSelectWire={setSelectedWireId}
              activeTool={activeTool}
              onAddProbe={handleToggleProbe}
              pendingGateType={pendingGateType}
              onPlaceGate={handlePlaceGate}
              onCursorMove={setCursorPos}
              onZoomChange={setZoom}
              onOpenProperties={() => setIsPropertiesOpen(true)}
            />
          </div>

          {/* Bottom Docked Multi-Channel Logic Analyzer Scope */}
          <Scope
            circuit={circuit}
            probedWireIds={probedWireIds}
            onRemoveProbe={id => setProbedWireIds(ids => ids.filter(i => i !== id))}
            onClearProbes={() => setProbedWireIds([])}
            getHistory={id => simulatorRef.current.getHistory(id)}
            isOpen={isScopeOpen}
            onClose={() => setIsScopeOpen(false)}
          />
        </div>

        {/* Right Property Inspector Panel */}
        <PropertyPanel
          circuit={circuit}
          selectedGateId={selectedGateId}
          selectedWireId={selectedWireId}
          onUpdateCircuit={updateCircuitWithUndo}
          onAddProbe={handleToggleProbe}
          onOpenMemoryEditor={g => setMemoryEditingGate(g)}
          probedWireIds={probedWireIds}
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <StatusBar
        theme={theme}
        circuit={circuit}
        activeTool={activeTool}
        isSimulating={isRunning}
        selectedGateId={selectedGateId}
        selectedWireId={selectedWireId}
        cursorPos={cursorPos}
        zoom={zoom}
      />

      {/* Modals */}
      <GatePropertiesModal
        gate={selectedGate}
        isOpen={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        onSaveGate={updated => {
          updateCircuitWithUndo({
            ...circuit,
            gates: circuit.gates.map(g => g.id === updated.id ? updated : g),
          });
        }}
      />

      <VerilogEditor
        circuit={circuit}
        isOpen={isVerilogOpen}
        onClose={() => setIsVerilogOpen(false)}
      />

      <MemoryEditorModal
        gate={memoryEditingGate}
        isOpen={Boolean(memoryEditingGate)}
        onClose={() => setMemoryEditingGate(null)}
        onSaveMemory={(gateId, mem) => {
          updateCircuitWithUndo({
            ...circuit,
            gates: circuit.gates.map(g =>
              g.id === gateId ? { ...g, state: { ...g.state, memory: mem } } : g
            ),
          });
        }}
      />

      <MacDownloadModal
        isOpen={isMacDownloadOpen}
        onClose={() => setIsMacDownloadOpen(false)}
      />
    </div>
  );
};

export default App;
