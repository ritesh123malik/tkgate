import React from 'react';
import { Apple, Download, Terminal, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface MacDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacDownloadModal: React.FC<MacDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e222b] border border-[#3d4455] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3d4455] bg-[#242936]">
          <div className="flex items-center space-x-3">
            <Apple className="w-6 h-6 text-slate-100" />
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100">
                TkGate Native Application for macOS (Apple Silicon / arm64)
              </h2>
              <p className="text-xs text-slate-400">
                TkGate v2.0.0-mac1 native standalone bundle with Tcl/Tk and Verga runtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs font-mono text-slate-300 overflow-y-auto max-h-[70vh]">
          <div className="bg-[#161922] p-4 rounded-lg border border-[#334155] space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Native Build Information</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              This build was packaged with embedded Tcl/Tk 8.6 runtime, complete Verga simulator, Gmac microcode compiler, gate libraries, and XQuartz launcher.
            </p>
            <div className="text-[11px] bg-[#0f172a] p-2.5 rounded border border-slate-800 space-y-1">
              <div><span className="text-slate-500">Architecture:</span> Apple Silicon (arm64 / M1/M2/M3/M4)</div>
              <div><span className="text-slate-500">Artifact:</span> TkGate-2.0.0-mac1-macOS-arm64.zip</div>
              <div><span className="text-slate-500">License:</span> GNU GPL-2.0-or-later</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Installation & Usage Steps:</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>Install <span className="text-blue-400">XQuartz</span> (<code className="text-slate-300">brew install --cask xquartz</code>) and log out/in.</li>
              <li>Extract <code className="text-slate-200">TkGate.app</code> into your <code className="text-slate-200">/Applications</code> folder.</li>
              <li>Launch via Finder or Terminal:</li>
            </ol>
            <div className="bg-[#0f172a] p-3 rounded border border-slate-800 text-emerald-400 text-[11px]">
              <code>"/Applications/TkGate.app/Contents/Resources/launcher"</code>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Standalone CLI Utilities included:</h3>
            <ul className="space-y-1 text-slate-400">
              <li><code className="text-amber-400">verga</code> — Standalone Verilog event-driven batch simulator</li>
              <li><code className="text-amber-400">gmac</code> — Menagerie micro/macro instruction compiler</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#1e222b] border-t border-[#3d4455]">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ad-hoc code signed bundle</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
