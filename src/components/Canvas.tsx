import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Circuit, Gate, Wire, Pin, LogicValue, GateType } from '../types/circuit';
import { GATE_CATALOG } from '../simulator/definitions';

interface CanvasProps {
  circuit: Circuit;
  onUpdateCircuit: (circuit: Circuit) => void;
  selectedGateId: string | null;
  onSelectGate: (gateId: string | null) => void;
  selectedWireId: string | null;
  onSelectWire: (wireId: string | null) => void;
  activeTool: 'select' | 'wire' | 'pan' | 'delete';
  onAddProbe: (wireId: string) => void;
  pendingGateType: GateType | null;
  onPlaceGate: (type: GateType, x: number, y: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  circuit,
  onUpdateCircuit,
  selectedGateId,
  onSelectGate,
  selectedWireId,
  onSelectWire,
  activeTool,
  onAddProbe,
  pendingGateType,
  onPlaceGate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Viewport transformation
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [zoom, setZoom] = useState<number>(1.0);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring states
  const [wiringStart, setWiringStart] = useState<{ gateId: string; pinId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback((sx: number, sy: number) => {
    return {
      x: (sx - offset.x) / zoom,
      y: (sy - offset.y) / zoom,
    };
  }, [offset, zoom]);

  // Snap to grid
  const snap = (v: number) => Math.round(v / 10) * 10;

  // Get absolute pin position
  const getPinPos = useCallback((gate: Gate, pin: Pin) => {
    return {
      x: gate.x + pin.relX,
      y: gate.y + pin.relY,
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);
    ctx.save();

    // Background
    ctx.fillStyle = '#161922';
    ctx.fillRect(0, 0, width, height);

    // Apply pan and zoom
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Grid rendering
    const gridSpacing = 20;
    const worldTopLeft = screenToWorld(0, 0);
    const worldBottomRight = screenToWorld(width, height);

    ctx.fillStyle = '#222838';
    const startX = Math.floor(worldTopLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldBottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTopLeft.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottomRight.y / gridSpacing) * gridSpacing;

    for (let x = startX; x <= endX; x += gridSpacing) {
      for (let y = startY; y <= endY; y += gridSpacing) {
        ctx.fillRect(x - 0.5, y - 0.5, 1.5, 1.5);
      }
    }

    // 1. Draw Wires
    for (const wire of circuit.wires) {
      const fromGate = circuit.gates.find(g => g.id === wire.fromGateId);
      const toGate = circuit.gates.find(g => g.id === wire.toGateId);
      if (!fromGate || !toGate) continue;

      const fromPin = fromGate.outputs.find(p => p.id === wire.fromPinId) || fromGate.inputs.find(p => p.id === wire.fromPinId);
      const toPin = toGate.inputs.find(p => p.id === wire.toPinId) || toGate.outputs.find(p => p.id === wire.toPinId);
      if (!fromPin || !toPin) continue;

      const p1 = getPinPos(fromGate, fromPin);
      const p2 = getPinPos(toGate, toPin);

      // Wire state color
      let color = '#64748b'; // 0
      if (wire.state === 1) color = '#10b981'; // 1
      else if (wire.state === 'Z') color = '#f59e0b'; // Z
      else if (wire.state === 'X') color = '#ef4444'; // X

      const isSelected = selectedWireId === wire.id;

      ctx.save();
      ctx.lineWidth = wire.busWidth > 1 ? 3.5 : (isSelected ? 3 : 2);
      ctx.strokeStyle = isSelected ? '#38bdf8' : color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (wire.state === 1) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      // Orthogonal routing
      const midX = (p1.x + p2.x) / 2;
      ctx.lineTo(midX, p1.y);
      ctx.lineTo(midX, p2.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Bus indicator
      if (wire.busWidth > 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`/${wire.busWidth}`, midX + 4, (p1.y + p2.y) / 2);
      }

      ctx.restore();
    }

    // 2. Draw Wire being drawn currently
    if (wiringStart) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(wiringStart.x, wiringStart.y);
      const midX = (wiringStart.x + mousePos.x) / 2;
      ctx.lineTo(midX, wiringStart.y);
      ctx.lineTo(midX, mousePos.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Gates
    for (const gate of circuit.gates) {
      const meta = GATE_CATALOG[gate.type] || GATE_CATALOG.AND;
      const isSelected = selectedGateId === gate.id;

      ctx.save();
      ctx.translate(gate.x, gate.y);

      // Gate background shadow / glow if selected
      if (isSelected) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-4, -4, meta.width + 8, meta.height + 8);
      }

      // Draw Gate Body according to Type
      renderGateBody(ctx, gate, meta);

      // Draw Pins
      renderPins(ctx, gate);

      ctx.restore();
    }

    ctx.restore();
  }, [circuit, offset, zoom, selectedGateId, selectedWireId, wiringStart, mousePos, getPinPos, screenToWorld]);

  // Render Gate Graphics
  function renderGateBody(ctx: CanvasRenderingContext2D, gate: Gate, meta: any) {
    const { width, height } = meta;

    switch (gate.type) {
      case 'AND':
      case 'NAND': {
        ctx.fillStyle = '#202636';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width * 0.5, 0);
        ctx.arc(width * 0.5, height / 2, height / 2, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (gate.type === 'NAND') {
          ctx.beginPath();
          ctx.arc(width - 5, height / 2, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#202636';
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '&', width * 0.4, height / 2 + 4);
        break;
      }

      case 'OR':
      case 'NOR': {
        ctx.fillStyle = '#202636';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width * 0.3, height / 2, 0, height);
        ctx.quadraticCurveTo(width * 0.7, height, width - (gate.type === 'NOR' ? 10 : 0), height / 2);
        ctx.quadraticCurveTo(width * 0.7, 0, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (gate.type === 'NOR') {
          ctx.beginPath();
          ctx.arc(width - 5, height / 2, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#202636';
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '≥1', width * 0.4, height / 2 + 4);
        break;
      }

      case 'XOR':
      case 'XNOR': {
        ctx.fillStyle = '#202636';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;

        // Front body
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(width * 0.35, height / 2, 8, height);
        ctx.quadraticCurveTo(width * 0.75, height, width - (gate.type === 'XNOR' ? 10 : 0), height / 2);
        ctx.quadraticCurveTo(width * 0.75, 0, 8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Extra back curve for XOR
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width * 0.25, height / 2, 0, height);
        ctx.stroke();

        if (gate.type === 'XNOR') {
          ctx.beginPath();
          ctx.arc(width - 5, height / 2, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#202636';
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '=1', width * 0.45, height / 2 + 4);
        break;
      }

      case 'NOT': {
        ctx.fillStyle = '#202636';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width - 10, height / 2);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inversion bubble
        ctx.beginPath();
        ctx.arc(width - 5, height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#202636';
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'BUF':
      case 'TRI': {
        ctx.fillStyle = '#202636';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, height / 2);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'SWITCH': {
        const isOn = gate.state.val === 1;
        ctx.fillStyle = '#1e2433';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // Lever track
        ctx.fillStyle = '#0f172a';
        ctx.roundRect(8, 12, 28, 16, 8);
        ctx.fill();

        // Lever knob
        ctx.fillStyle = isOn ? '#10b981' : '#64748b';
        if (isOn) {
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(isOn ? 28 : 16, 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(isOn ? 'ON' : 'OFF', 22, 36);
        break;
      }

      case 'BUTTON': {
        const isPressed = gate.state.val === 1;
        ctx.fillStyle = '#1e2433';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // Push button circle
        ctx.fillStyle = isPressed ? '#3b82f6' : '#334155';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, isPressed ? 11 : 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPressed ? '#60a5fa' : '#475569';
        ctx.stroke();
        break;
      }

      case 'CLOCK': {
        const isHigh = gate.state.clockState === 1;
        ctx.fillStyle = '#1e2433';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // Pulse wave symbol
        ctx.strokeStyle = isHigh ? '#10b981' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 26);
        ctx.lineTo(18, 26);
        ctx.lineTo(18, 14);
        ctx.lineTo(26, 14);
        ctx.lineTo(26, 26);
        ctx.lineTo(34, 26);
        ctx.stroke();

        ctx.fillStyle = isHigh ? '#10b981' : '#64748b';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${gate.state.clockFreq || 1}Hz`, width / 2, 36);
        break;
      }

      case 'DIP4': {
        const dipVal = Number(gate.state.val ?? 0);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // 4 mini switches
        for (let i = 0; i < 4; i++) {
          const bitOn = (dipVal & (1 << i)) !== 0;
          const y = 10 + i * 14;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(15, y, 24, 10);
          ctx.fillStyle = bitOn ? '#10b981' : '#64748b';
          ctx.fillRect(bitOn ? 27 : 16, y + 1, 10, 8);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText(`Q${i}`, 4, y + 8);
        }
        break;
      }

      case 'LED': {
        const isOn = gate.state.val === 1;
        const color = gate.state.color || '#10b981';

        ctx.fillStyle = '#1e2433';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
        if (isOn) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.stroke();
        }

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || 'LED', width / 2, height - 2);
        break;
      }

      case 'SEVEN_SEG': {
        const val = Number(gate.state.val ?? 0);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // 7 segments layout
        renderSevenSegment(ctx, 16, 12, 28, 48, val);

        ctx.fillStyle = '#64748b';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('0x' + val.toString(16).toUpperCase(), width / 2, height - 6);
        break;
      }

      case 'HEX_DISP': {
        const val = Number(gate.state.val ?? 0);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.font = 'bold 24px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(16).toUpperCase(), width / 2, height / 2);
        ctx.shadowBlur = 0;
        break;
      }

      case 'TTY': {
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        // CRT scanline header
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(2, 2, width - 4, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText('TkGate TTY Terminal', 8, 13);

        // Terminal text
        ctx.fillStyle = '#10b981';
        ctx.font = '10px JetBrains Mono, monospace';
        const txt = gate.state.ttyText || 'READY>';
        const lines = txt.match(/.{1,16}/g) || ['READY>'];
        lines.slice(-4).forEach((line, i) => {
          ctx.fillText(line, 8, 34 + i * 14);
        });
        break;
      }

      case 'COMMENT': {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.setLineDash([3, 3]);
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        const lines = (gate.state.commentText || gate.name || 'Note').split('\n');
        lines.forEach((l, i) => {
          ctx.fillText(l, 8, 18 + i * 14);
        });
        break;
      }

      default: {
        // Generic chip representation
        ctx.fillStyle = '#1e2433';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, width, height, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(meta.label || gate.type, width / 2, height / 2 - 4);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(gate.name || '', width / 2, height / 2 + 12);
        break;
      }
    }
  }

  // Helper to draw 7-segment display
  function renderSevenSegment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, val: number) {
    const segMap: Record<number, boolean[]> = {
      0: [true, true, true, true, true, true, false],
      1: [false, true, true, false, false, false, false],
      2: [true, true, false, true, true, false, true],
      3: [true, true, true, true, false, false, true],
      4: [false, true, true, false, false, true, true],
      5: [true, false, true, true, false, true, true],
      6: [true, false, true, true, true, true, true],
      7: [true, true, true, false, false, false, false],
      8: [true, true, true, true, true, true, true],
      9: [true, true, true, true, false, true, true],
      10: [true, true, true, false, true, true, true], // A
      11: [false, false, true, true, true, true, true], // b
      12: [true, false, false, true, true, true, false], // C
      13: [false, true, true, true, true, false, true], // d
      14: [true, false, false, true, true, true, true], // E
      15: [true, false, false, false, true, true, true], // F
    };

    const segs = segMap[val & 0x0F] || segMap[0];
    const offColor = '#1e293b';
    const onColor = '#ef4444'; // Red LED segments

    const drawSeg = (active: boolean, sx: number, sy: number, sw: number, sh: number) => {
      ctx.fillStyle = active ? onColor : offColor;
      if (active) {
        ctx.shadowColor = onColor;
        ctx.shadowBlur = 6;
      }
      ctx.fillRect(sx, sy, sw, sh);
      ctx.shadowBlur = 0;
    };

    const t = 4; // thickness
    drawSeg(segs[0], x + t, y, w - t * 2, t); // a (top)
    drawSeg(segs[1], x + w - t, y + t, t, h / 2 - t); // b (top right)
    drawSeg(segs[2], x + w - t, y + h / 2, t, h / 2 - t); // c (bottom right)
    drawSeg(segs[3], x + t, y + h - t, w - t * 2, t); // d (bottom)
    drawSeg(segs[4], x, y + h / 2, t, h / 2 - t); // e (bottom left)
    drawSeg(segs[5], x, y + t, t, h / 2 - t); // f (top left)
    drawSeg(segs[6], x + t, y + h / 2 - t / 2, w - t * 2, t); // g (middle)
  }

  // Draw input & output pins on gate
  function renderPins(ctx: CanvasRenderingContext2D, gate: Gate) {
    const allPins = [...gate.inputs, ...gate.outputs];

    for (const pin of allPins) {
      const isOutput = pin.type === 'out';
      ctx.fillStyle = isOutput ? '#38bdf8' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(pin.relX, pin.relY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pin label
      ctx.fillStyle = '#64748b';
      ctx.font = '8px JetBrains Mono';
      ctx.textAlign = isOutput ? 'right' : 'left';
      ctx.fillText(pin.name, pin.relX + (isOutput ? -6 : 6), pin.relY + 3);
    }
  }

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (e.button === 1 || activeTool === 'pan' || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: sx - offset.x, y: sy - offset.y });
      return;
    }

    // Placing a new gate
    if (pendingGateType) {
      onPlaceGate(pendingGateType, snap(world.x), snap(world.y));
      return;
    }

    // Check if clicked on a Gate's interactive control (e.g. switch or button)
    for (const gate of circuit.gates) {
      const meta = GATE_CATALOG[gate.type] || GATE_CATALOG.AND;
      if (
        world.x >= gate.x &&
        world.x <= gate.x + meta.width &&
        world.y >= gate.y &&
        world.y <= gate.y + meta.height
      ) {
        if (gate.type === 'SWITCH') {
          // Toggle switch
          const updatedGates = circuit.gates.map(g =>
            g.id === gate.id ? { ...g, state: { ...g.state, val: g.state.val === 1 ? 0 : 1 } } : g
          );
          onUpdateCircuit({ ...circuit, gates: updatedGates });
          return;
        } else if (gate.type === 'BUTTON') {
          // Press button
          const updatedGates = circuit.gates.map(g =>
            g.id === gate.id ? { ...g, state: { ...g.state, val: 1 } } : g
          );
          onUpdateCircuit({ ...circuit, gates: updatedGates });
          return;
        } else if (gate.type === 'DIP4') {
          // Toggle the specific dip switch clicked
          const relY = world.y - gate.y;
          const bitIndex = Math.min(3, Math.max(0, Math.floor((relY - 6) / 14)));
          const current = Number(gate.state.val ?? 0);
          const nextVal = current ^ (1 << bitIndex);
          const updatedGates = circuit.gates.map(g =>
            g.id === gate.id ? { ...g, state: { ...g.state, val: nextVal } } : g
          );
          onUpdateCircuit({ ...circuit, gates: updatedGates });
          return;
        }
      }
    }

    // Check if clicked on a pin (start wiring or finish wiring)
    for (const gate of circuit.gates) {
      const allPins = [...gate.inputs, ...gate.outputs];
      for (const pin of allPins) {
        const pinPos = getPinPos(gate, pin);
        const dist = Math.hypot(world.x - pinPos.x, world.y - pinPos.y);
        if (dist <= 8) {
          if (!wiringStart) {
            // Start wiring from this pin
            setWiringStart({
              gateId: gate.id,
              pinId: pin.id,
              x: pinPos.x,
              y: pinPos.y,
            });
          } else {
            // Complete wiring if different gates
            if (wiringStart.gateId !== gate.id) {
              const newWire: Wire = {
                id: `wire_${Date.now()}`,
                name: `w${circuit.wires.length}`,
                fromGateId: wiringStart.gateId,
                fromPinId: wiringStart.pinId,
                toGateId: gate.id,
                toPinId: pin.id,
                busWidth: pin.busWidth || 1,
                state: 0,
              };
              onUpdateCircuit({
                ...circuit,
                wires: [...circuit.wires, newWire],
              });
            }
            setWiringStart(null);
          }
          return;
        }
      }
    }

    // Check if clicked on a gate to select or drag
    for (let i = circuit.gates.length - 1; i >= 0; i--) {
      const gate = circuit.gates[i];
      const meta = GATE_CATALOG[gate.type] || GATE_CATALOG.AND;
      if (
        world.x >= gate.x &&
        world.x <= gate.x + meta.width &&
        world.y >= gate.y &&
        world.y <= gate.y + meta.height
      ) {
        if (activeTool === 'delete') {
          // Delete gate and connected wires
          const newGates = circuit.gates.filter(g => g.id !== gate.id);
          const newWires = circuit.wires.filter(w => w.fromGateId !== gate.id && w.toGateId !== gate.id);
          onUpdateCircuit({ ...circuit, gates: newGates, wires: newWires });
          onSelectGate(null);
          return;
        }

        onSelectGate(gate.id);
        onSelectWire(null);
        setDraggingGateId(gate.id);
        setDragOffset({ x: world.x - gate.x, y: world.y - gate.y });
        return;
      }
    }

    // Check if clicked on a wire
    for (const wire of circuit.wires) {
      const fromGate = circuit.gates.find(g => g.id === wire.fromGateId);
      const toGate = circuit.gates.find(g => g.id === wire.toGateId);
      if (!fromGate || !toGate) continue;
      const fromPin = fromGate.outputs.find(p => p.id === wire.fromPinId) || fromGate.inputs.find(p => p.id === wire.fromPinId);
      const toPin = toGate.inputs.find(p => p.id === wire.toPinId) || toGate.outputs.find(p => p.id === wire.toPinId);
      if (!fromPin || !toPin) continue;

      const p1 = getPinPos(fromGate, fromPin);
      const p2 = getPinPos(toGate, toPin);
      const midX = (p1.x + p2.x) / 2;

      // Approximate hit test on orthogonal wire
      const d1 = Math.abs(world.y - p1.y) < 6 && world.x >= Math.min(p1.x, midX) - 4 && world.x <= Math.max(p1.x, midX) + 4;
      const d2 = Math.abs(world.x - midX) < 6 && world.y >= Math.min(p1.y, p2.y) - 4 && world.y <= Math.max(p1.y, p2.y) + 4;
      const d3 = Math.abs(world.y - p2.y) < 6 && world.x >= Math.min(midX, p2.x) - 4 && world.x <= Math.max(midX, p2.x) + 4;

      if (d1 || d2 || d3) {
        if (activeTool === 'delete') {
          onUpdateCircuit({
            ...circuit,
            wires: circuit.wires.filter(w => w.id !== wire.id),
          });
          onSelectWire(null);
        } else {
          onSelectWire(wire.id);
          onSelectGate(null);
        }
        return;
      }
    }

    // Clicked empty background
    onSelectGate(null);
    onSelectWire(null);
    if (wiringStart) setWiringStart(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    setMousePos(world);

    if (isPanning) {
      setOffset({
        x: sx - panStart.x,
        y: sy - panStart.y,
      });
      return;
    }

    if (draggingGateId) {
      const nextX = snap(world.x - dragOffset.x);
      const nextY = snap(world.y - dragOffset.y);
      const updatedGates = circuit.gates.map(g =>
        g.id === draggingGateId ? { ...g, x: nextX, y: nextY } : g
      );
      onUpdateCircuit({ ...circuit, gates: updatedGates });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingGateId(null);

    // If button was pressed, release it
    const hasPressedButton = circuit.gates.some(g => g.type === 'BUTTON' && g.state.val === 1);
    if (hasPressedButton) {
      const updatedGates = circuit.gates.map(g =>
        g.type === 'BUTTON' ? { ...g, state: { ...g.state, val: 0 } } : g
      );
      onUpdateCircuit({ ...circuit, gates: updatedGates });
    }
  };

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(3.0, Math.max(0.3, zoom * zoomFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const mouseWorldX = (sx - offset.x) / zoom;
    const mouseWorldY = (sy - offset.y) / zoom;

    setZoom(newZoom);
    setOffset({
      x: sx - mouseWorldX * newZoom,
      y: sy - mouseWorldY * newZoom,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      {/* Floating Canvas Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 bg-[#1e222b]/90 backdrop-blur-md border border-[#3d4455] rounded-lg px-2 py-1 shadow-lg text-xs font-mono text-slate-300">
        <button
          onClick={() => setZoom(z => Math.min(3.0, z * 1.2))}
          className="p-1.5 hover:bg-slate-700 rounded transition"
          title="Zoom In (+)"
        >
          +
        </button>
        <span className="px-1 text-slate-400">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
          className="p-1.5 hover:bg-slate-700 rounded transition"
          title="Zoom Out (-)"
        >
          -
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-1" />
        <button
          onClick={() => { setZoom(1.0); setOffset({ x: 40, y: 40 }); }}
          className="p-1.5 hover:bg-slate-700 rounded transition"
          title="Reset View"
        >
          1:1
        </button>
      </div>
    </div>
  );
};
