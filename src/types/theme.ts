export type UiTheme = 'classic' | 'dark';

export interface ThemeColors {
  bg: string;
  canvasBg: string;
  gridDot: string;
  panelBg: string;
  panelBorder: string;
  toolbarBg: string;
  toolbarBorder: string;
  textPrimary: string;
  textSecondary: string;
  gateBody: string;
  gateBorder: string;
  gateText: string;
  wire0: string;
  wire1: string;
  wireZ: string;
  wireX: string;
  bus: string;
  selection: string;
}

export const THEMES: Record<UiTheme, ThemeColors> = {
  classic: {
    bg: '#d6d6d0',
    canvasBg: '#fbfbf9',
    gridDot: '#b0b0a8',
    panelBg: '#e6e6e0',
    panelBorder: '#999990',
    toolbarBg: '#dcdcd6',
    toolbarBorder: '#a0a098',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    gateBody: '#efefe9',
    gateBorder: '#1a1a1a',
    gateText: '#1a1a1a',
    wire0: '#00008b', // Dark blue in classic
    wire1: '#008b00', // green4 in TkGate
    wireZ: '#b8860b', // dark goldenrod
    wireX: '#cc0000', // red
    bus: '#b22222',   // red firebrick
    selection: '#0066cc',
  },
  dark: {
    bg: '#161922',
    canvasBg: '#13161f',
    gridDot: '#252b3b',
    panelBg: '#1a1e28',
    panelBorder: '#333d4e',
    toolbarBg: '#1e222b',
    toolbarBorder: '#3d4455',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    gateBody: '#202636',
    gateBorder: '#94a3b8',
    gateText: '#f8fafc',
    wire0: '#64748b',
    wire1: '#10b981',
    wireZ: '#f59e0b',
    wireX: '#ef4444',
    bus: '#ec4899',
    selection: '#38bdf8',
  },
};
