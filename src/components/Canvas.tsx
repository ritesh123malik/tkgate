import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Circuit, Gate, Wire, Pin, LogicValue, GateType } from '../types/circuit';
import { GATE_CATALOG } from '../simulator/definitions';
import { UiTheme, THEMES } from '../types/theme';

interface CanvasProps {
  theme: UiTheme;
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
  onCursorMove?: (pos: { x: number; y: number }) => void;
  onZoomChange?: (z: number) => void;
  onOpenProperties?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  theme,
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
  onCursorMove,
  onZoomChange,
  onOpenProperties,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = THEMES[theme];

  // Viewport transformation
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 60, y: 60 });
  const [zoom, setZoom] = useState<number>(1.0);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingGateId, setDraggingGateId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring states
  const [wiringStart, setWiringStart] = useState<{ gateId: string; pinId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Notify parent of zoom change
  useEffect(() => {
    if (onZoomChange) onZoomChange(zoom);
  }, [zoom, onZoomChange]);

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

    // Canvas Background
    ctx.fillStyle = colors.canvasBg;
    ctx.fillRect(0, 0, width, height);

    // Apply pan and zoom
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Grid rendering (TkGate grid dots)
    const gridSpacing = 20;
    const worldTopLeft = screenToWorld(0, 0);
    const worldBottomRight = screenToWorld(width, height);

    ctx.fillStyle = colors.gridDot;
    const startX = Math.floor(worldTopLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldBottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTopLeft.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottomRight.y / gridSpacing) * gridSpacing;

    for (let x = startX; x <= endX; x += gridSpacing) {
      for (let y = startY; y <= endY; y += gridSpacing) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }

    // 1. Draw Wires with TkGate styling
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
      let color = colors.wire0;
      if (wire.state === 1) color = colors.wire1;
      else if (wire.state === 'Z') color = colors.wireZ;
      else if (wire.state === 'X') color = colors.wireX;

      const isSelected = selectedWireId === wire.id;

      ctx.save();
      ctx.lineWidth = wire.busWidth > 1 ? 3.5 : (isSelected ? 3 : 2);
      ctx.strokeStyle = isSelected ? colors.selection : (wire.busWidth > 1 ? colors.bus : color);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (wire.state === 1 && theme === 'dark') {
        ctx.shadowColor = colors.wire1;
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
        ctx.fillStyle = colors.textSecondary;
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`/${wire.busWidth}`, midX + 4, (p1.y + p2.y) / 2);
      }

      // Solder junction dots
      ctx.fillStyle = isSelected ? colors.selection : color;
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Draw Wire being drawn currently
    if (wiringStart) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.selection;
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

      // Selection box
      if (isSelected) {
        ctx.strokeStyle = colors.selection;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(-5, -5, meta.width + 10, meta.height + 10);
        ctx.setLineDash([]);
      }

      // Draw Gate Body according to Type
      renderGateBody(ctx, gate, meta);

      // Draw Pins
      renderPins(ctx, gate);

      ctx.restore();
    }

    ctx.restore();
  }, [circuit, offset, zoom, selectedGateId, selectedWireId, wiringStart, mousePos, getPinPos, screenToWorld, theme, colors]);

  // Render Gate Graphics with authentic logic symbols
  function renderGateBody(ctx: CanvasRenderingContext2D, gate: Gate, meta: any) {
    const { width, height } = meta;
    const bodyFill = colors.gateBody;
    const strokeCol = colors.gateBorder;

    switch (gate.type) {
      case 'AND':
      case 'NAND': {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
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
          ctx.fillStyle = bodyFill;
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '&', width * 0.4, height / 2 + 4);
        break;
      }

      case 'OR':
      case 'NOR': {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
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
          ctx.fillStyle = bodyFill;
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '≥1', width * 0.4, height / 2 + 4);
        break;
      }

      case 'XOR':
      case 'XNOR': {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2;

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
          ctx.fillStyle = bodyFill;
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || '=1', width * 0.45, height / 2 + 4);
        break;
      }

      case 'NOT': {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
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
        ctx.fillStyle = bodyFill;
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'BUF':
      case 'TRI': {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
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
        ctx.fillStyle = theme === 'classic' ? '#dcdcd6' : '#1e2433';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        // Lever track
        ctx.fillStyle = theme === 'classic' ? '#999990' : '#0f172a';
        ctx.roundRect(8, 12, 28, 16, 8);
        ctx.fill();

        // Lever knob
        ctx.fillStyle = isOn ? '#10b981' : (theme === 'classic' ? '#666660' : '#64748b');
        if (isOn && theme === 'dark') {
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(isOn ? 28 : 16, 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = colors.textPrimary;
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(isOn ? 'ON' : 'OFF', 22, 36);
        break;
      }

      case 'BUTTON': {
        const isPressed = gate.state.val === 1;
        ctx.fillStyle = theme === 'classic' ? '#dcdcd6' : '#1e2433';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isPressed ? '#3b82f6' : (theme === 'classic' ? '#a0a098' : '#334155');
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, isPressed ? 11 : 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeCol;
        ctx.stroke();
        break;
      }

      case 'CLOCK': {
        const isHigh = gate.state.clockState === 1;
        ctx.fillStyle = theme === 'classic' ? '#dcdcd6' : '#1e2433';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        // Pulse wave symbol
        ctx.strokeStyle = isHigh ? colors.wire1 : colors.wire0;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 26);
        ctx.lineTo(18, 26);
        ctx.lineTo(18, 14);
        ctx.lineTo(26, 14);
        ctx.lineTo(26, 26);
        ctx.lineTo(34, 26);
        ctx.stroke();

        ctx.fillStyle = isHigh ? colors.wire1 : colors.wire0;
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${gate.state.clockFreq || 1}Hz`, width / 2, 36);
        break;
      }

      case 'DIP4': {
        const dipVal = Number(gate.state.val ?? 0);
        ctx.fillStyle = theme === 'classic' ? '#dcdcd6' : '#1e293b';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
          const bitOn = (dipVal & (1 << i)) !== 0;
          const y = 10 + i * 14;
          ctx.fillStyle = theme === 'classic' ? '#a0a098' : '#0f172a';
          ctx.fillRect(15, y, 24, 10);
          ctx.fillStyle = bitOn ? '#10b981' : (theme === 'classic' ? '#666660' : '#64748b');
          ctx.fillRect(bitOn ? 27 : 16, y + 1, 10, 8);
          ctx.fillStyle = colors.textSecondary;
          ctx.font = '8px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText(`Q${i}`, 4, y + 8);
        }
        break;
      }

      case 'LED': {
        const isOn = gate.state.val === 1;
        const color = gate.state.color || '#10b981';

        ctx.fillStyle = theme === 'classic' ? '#dcdcd6' : '#1e2433';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
        if (isOn) {
          ctx.fillStyle = color;
          if (theme === 'dark') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = theme === 'classic' ? '#e6e6fa' : '#1e293b';
          ctx.fill();
          ctx.strokeStyle = strokeCol;
          ctx.stroke();
        }

        ctx.fillStyle = colors.textPrimary;
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(gate.name || 'LED', width / 2, height - 2);
        break;
      }

      case 'SEVEN_SEG': {
        const val = Number(gate.state.val ?? 0);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        renderSevenSegment(ctx, 16, 12, 28, 48, val);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('0x' + val.toString(16).toUpperCase(), width / 2, height - 6);
        break;
      }

      case 'HEX_DISP': {
        const val = Number(gate.state.val ?? 0);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
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
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(2, 2, width - 4, 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText('TkGate TTY Terminal', 8, 13);

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
        ctx.fillStyle = theme === 'classic' ? '#ffffd0' : '#1e293b';
        ctx.strokeStyle = strokeCol;
        ctx.setLineDash([3, 3]);
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = colors.textPrimary;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        const lines = (gate.state.commentText || gate.name || 'Note').split('\n');
        lines.forEach((l, i) => {
          ctx.fillText(l, 8, 18 + i * 14);
        });
        break;
      }

      default: {
        ctx.fillStyle = bodyFill;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.roundRect(0, 0, width, height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = colors.textPrimary;
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(meta.label || gate.type, width / 2, height / 2 - 4);

        ctx.fillStyle = colors.textSecondary;
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(gate.name || '', width / 2, height / 2 + 12);
        break;
      }
    }
  }

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
      10: [true, true, true, false, true, true, true],
      11: [false, false, true, true, true, true, true],
      12: [true, false, false, true, true, true, false],
      13: [false, true, true, true, true, false, true],
      14: [true, false, false, true, true, true, true],
      15: [true, false, false, false, true, true, true],
    };

    const segs = segMap[val & 0x0F] || segMap[0];
    const offColor = '#1e293b';
    const onColor = '#ef4444';

    const drawSeg = (active: boolean, sx: number, sy: number, sw: number, sh: number) => {
      ctx.fillStyle = active ? onColor : offColor;
      if (active) {
        ctx.shadowColor = onColor;
        ctx.shadowBlur = 6;
      }
      ctx.fillRect(sx, sy, sw, sh);
      ctx.shadowBlur = 0;
    };

    const t = 4;
    drawSeg(segs[0], x + t, y, w - t * 2, t);
    drawSeg(segs[1], x + w - t, y + t, t, h / 2 - t);
    drawSeg(segs[2], x + w - t, y + h / 2, t, h / 2 - t);
    drawSeg(segs[3], x + t, y + h - t, w - t * 2, t);
    drawSeg(segs[4], x, y + h / 2, t, h / 2 - t);
    drawSeg(segs[5], x, y + t, t, h / 2 - t);
    drawSeg(segs[6], x + t, y + h / 2 - t / 2, w - t * 2, t);
  }

  function renderPins(ctx: CanvasRenderingContext2D, gate: Gate) {
    const allPins = [...gate.inputs, ...gate.outputs];

    for (const pin of allPins) {
      const isOutput = pin.type === 'out';
      ctx.fillStyle = isOutput ? '#38bdf8' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(pin.relX, pin.relY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.textSecondary;
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

    if (pendingGateType) {
      onPlaceGate(pendingGateType, snap(world.x), snap(world.y));
      return;
    }

    // Double click to open gate properties
    if (e.detail === 2) {
      for (const gate of circuit.gates) {
        const meta = GATE_CATALOG[gate.type] || GATE_CATALOG.AND;
        if (
          world.x >= gate.x &&
          world.x <= gate.x + meta.width &&
          world.y >= gate.y &&
          world.y <= gate.y + meta.height
        ) {
          onSelectGate(gate.id);
          if (onOpenProperties) onOpenProperties();
          return;
        }
      }
    }

    // Check click on interactive control
    for (const gate of circuit.gates) {
      const meta = GATE_CATALOG[gate.type] || GATE_CATALOG.AND;
      if (
        world.x >= gate.x &&
        world.x <= gate.x + meta.width &&
        world.y >= gate.y &&
        world.y <= gate.y + meta.height
      ) {
        if (gate.type === 'SWITCH') {
          const updatedGates = circuit.gates.map(g =>
            g.id === gate.id ? { ...g, state: { ...g.state, val: g.state.val === 1 ? 0 : 1 } } : g
          );
          onUpdateCircuit({ ...circuit, gates: updatedGates });
          return;
        } else if (gate.type === 'BUTTON') {
          const updatedGates = circuit.gates.map(g =>
            g.id === gate.id ? { ...g, state: { ...g.state, val: 1 } } : g
          );
          onUpdateCircuit({ ...circuit, gates: updatedGates });
          return;
        } else if (gate.type === 'DIP4') {
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

    // Check click on pins
    for (const gate of circuit.gates) {
      const allPins = [...gate.inputs, ...gate.outputs];
      for (const pin of allPins) {
        const pinPos = getPinPos(gate, pin);
        const dist = Math.hypot(world.x - pinPos.x, world.y - pinPos.y);
        if (dist <= 8) {
          if (!wiringStart) {
            setWiringStart({
              gateId: gate.id,
              pinId: pin.id,
              x: pinPos.x,
              y: pinPos.y,
            });
          } else {
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

    // Check click on gate
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

    // Check click on wire
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
    if (onCursorMove) onCursorMove(world);

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

    const hasPressedButton = circuit.gates.some(g => g.type === 'BUTTON' && g.state.val === 1);
    if (hasPressedButton) {
      const updatedGates = circuit.gates.map(g =>
        g.type === 'BUTTON' ? { ...g, state: { ...g.state, val: 0 } } : g
      );
      onUpdateCircuit({ ...circuit, gates: updatedGates });
    }
  };

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
      <div className="absolute bottom-3 right-3 flex items-center space-x-1.5 bg-[#1e222b]/90 backdrop-blur-md border border-[#3d4455] rounded px-2 py-1 shadow-lg text-xs font-mono text-slate-300">
        <button
          onClick={() => setZoom(z => Math.min(3.0, z * 1.2))}
          className="p-1 hover:bg-slate-700 rounded transition"
          title="Zoom In (+)"
        >
          +
        </button>
        <span className="px-1 text-slate-400">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
          className="p-1 hover:bg-slate-700 rounded transition"
          title="Zoom Out (-)"
        >
          -
        </button>
        <div className="w-[1px] h-3 bg-slate-700 mx-1" />
        <button
          onClick={() => { setZoom(1.0); setOffset({ x: 60, y: 60 }); }}
          className="p-1 hover:bg-slate-700 rounded transition"
          title="Reset View (1:1)"
        >
          1:1
        </button>
      </div>
    </div>
  );
};
