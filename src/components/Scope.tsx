import React, { useRef, useEffect } from 'react';
import { Circuit, WaveformSample, LogicValue } from '../types/circuit';
import { Activity, X, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

interface ScopeProps {
  circuit: Circuit;
  probedWireIds: string[];
  onRemoveProbe: (wireId: string) => void;
  onClearProbes: () => void;
  getHistory: (wireId: string) => WaveformSample[];
  isOpen: boolean;
  onClose: () => void;
}

export const Scope: React.FC<ScopeProps> = ({
  circuit,
  probedWireIds,
  onRemoveProbe,
  onClearProbes,
  getHistory,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
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

    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (probedWireIds.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('No signals probed. Right-click or select a wire and click "Add Probe".', width / 2, height / 2);
      return;
    }

    const channelHeight = Math.min(50, Math.floor((height - 30) / Math.max(1, probedWireIds.length)));
    const leftMargin = 120;
    const plotWidth = width - leftMargin - 20;

    // Time grid header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(leftMargin, 0, plotWidth, 24);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Time markings
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) {
      const gx = leftMargin + (plotWidth * i) / 10;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();

      const timeVal = Math.round((circuit.timeNs / 10) * i);
      ctx.fillText(`${timeVal}ns`, gx, 16);
    }

    // Render channels
    probedWireIds.forEach((wireId, idx) => {
      const wire = circuit.wires.find(w => w.id === wireId);
      const wireName = wire?.name || wireId;
      const history = getHistory(wireId);
      const yBase = 30 + idx * channelHeight;

      // Channel divider
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, yBase + channelHeight);
      ctx.lineTo(width, yBase + channelHeight);
      ctx.stroke();

      // Label & live value
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(wireName, 12, yBase + channelHeight / 2 - 2);

      const curVal = wire?.state ?? 0;
      let valColor = '#64748b';
      if (curVal === 1) valColor = '#10b981';
      else if (curVal === 'Z') valColor = '#f59e0b';
      else if (curVal === 'X') valColor = '#ef4444';

      ctx.fillStyle = valColor;
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`val: ${curVal}`, 12, yBase + channelHeight / 2 + 12);

      // Plot digital waveform
      if (history.length > 1) {
        ctx.save();
        ctx.strokeStyle = valColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = valColor;
        ctx.shadowBlur = 3;

        const highY = yBase + 10;
        const lowY = yBase + channelHeight - 12;

        ctx.beginPath();
        history.forEach((sample, sIdx) => {
          const px = leftMargin + (sIdx / (history.length - 1)) * plotWidth;
          const py = sample.value === 1 ? highY : (sample.value === 0 ? lowY : (highY + lowY) / 2);

          if (sIdx === 0) {
            ctx.moveTo(px, py);
          } else {
            const prevPy = history[sIdx - 1].value === 1 ? highY : (history[sIdx - 1].value === 0 ? lowY : (highY + lowY) / 2);
            if (prevPy !== py) {
              ctx.lineTo(px, prevPy); // Vertical transition edge
            }
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
        ctx.restore();
      }
    });

  }, [circuit, probedWireIds, getHistory, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-64 bg-[#141822] border-t border-[#3d4455] flex flex-col z-20 shadow-2xl transition-all">
      {/* Scope Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e222b] border-b border-[#3d4455]">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            TkGate Logic Analyzer & Waveform Scope
          </span>
          <span className="text-xs font-mono text-slate-400 ml-4">
            Sim Time: <span className="text-emerald-400">{circuit.timeNs} ns</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClearProbes}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
            title="Clear all probe traces"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="Close Scope"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scope Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
