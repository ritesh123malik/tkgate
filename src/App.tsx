import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Circuit, Gate, GateType, Wire } from './types/circuit';
import { CircuitSimulator } from './simulator/engine';
import { EXAMPLES } from './examples/circuits';
import { GATE_CATALOG } from './simulator/definitions';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Scope } from './components/Scope';
import { PropertyPanel } from './components/PropertyPanel';
import { VerilogEditor } from './components/VerilogEditor';
import { MemoryEditorModal } from './components/MemoryEditorModal';
import { MacDownloadModal } from './components/MacDownloadModal';

export const App: React.FC = () => {
  // Main circuit state (starts with the iconic 4-Bit Counter with 7-Segment Display)
  const [circuit, setCircuit] = useState<Circuit>(EXAMPLES.counter_7seg);

  // Simulation engine instance
  const simulatorRef = useRef<CircuitSimulator>(new CircuitSimulator());
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(10); // Hz

  // Selection & tool states
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'wire' | 'pan' | 'delete'>('select');
  const [pendingGateType, setPendingGateType] = useState<GateType | null>(null);

  // Modals & Panels
  const [isScopeOpen, setIsScopeOpen] = useState<boolean>(true);
  const [probedWireIds, setProbedWireIds] = useState<string[]>(['w_clk', 'w_q0', 'w_q1', 'w_q2', 'w_q3']);
  const [isVerilogOpen, setIsVerilogOpen] = useState<boolean>(false);
  const [isMacDownloadOpen, setIsMacDownloadOpen] = useState<boolean>(false);
  const [memoryEditingGate, setMemoryEditingGate] = useState<Gate | null>(null);

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
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
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
      } else if (e.key.toLowerCase() === 'w') {
        setActiveTool('wire');
      } else if (e.key.toLowerCase() === 's') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'r' && selectedGateId) {
        // Rotate gate
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
  }, [selectedGateId, selectedWireId]);

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
      simulatorRef.current.reset();
      setCircuit(ex);
      setSelectedGateId(null);
      setSelectedWireId(null);
      // Auto probe top wires
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

  return (
    <div className="flex flex-col w-screen h-screen bg-[#161922] text-slate-100 font-sans overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar
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
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Component Library Palette */}
        <Sidebar
          onSelectGateType={type => setPendingGateType(type)}
          pendingGateType={pendingGateType}
        />

        {/* Central Canvas & Scope */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="flex-1 relative">
            <Canvas
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
            />
          </div>

          {/* Bottom Waveform Logic Analyzer Scope */}
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
          onUpdateCircuit={setCircuit}
          onAddProbe={handleToggleProbe}
          onOpenMemoryEditor={g => setMemoryEditingGate(g)}
          probedWireIds={probedWireIds}
        />
      </div>

      {/* Verilog Netlist Modal */}
      <VerilogEditor
        circuit={circuit}
        isOpen={isVerilogOpen}
        onClose={() => setIsVerilogOpen(false)}
      />

      {/* Hex RAM/ROM Memory Modal */}
      <MemoryEditorModal
        gate={memoryEditingGate}
        isOpen={Boolean(memoryEditingGate)}
        onClose={() => setMemoryEditingGate(null)}
        onSaveMemory={(gateId, mem) => {
          setCircuit(prev => ({
            ...prev,
            gates: prev.gates.map(g =>
              g.id === gateId ? { ...g, state: { ...g.state, memory: mem } } : g
            ),
          }));
        }}
      />

      {/* Native macOS Port Info Modal */}
      <MacDownloadModal
        isOpen={isMacDownloadOpen}
        onClose={() => setIsMacDownloadOpen(false)}
      />
    </div>
  );
};

export default App;
