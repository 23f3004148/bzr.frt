import React from 'react';
import { AppState } from '../types';

interface FooterProps {
  onNavigate: (state: AppState) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full text-white" style={{ background: 'var(--gradient-footer)' }}>
      <div className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src="/footer_logo.svg" alt="Buuzzer" className="h-12 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Buuzzer Copilot</div>
              <div className="text-xs text-white/70">Privacy-first interview assistance</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              onClick={() => onNavigate(AppState.FEATURES)}
              className="rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => onNavigate(AppState.HOW_IT_WORKS)}
              className="rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              How it works
            </button>
            <button
              onClick={() => onNavigate(AppState.PRIVACY)}
              className="rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Privacy
            </button>
            <button
              onClick={() => onNavigate(AppState.TERMS)}
              className="rounded-lg px-3 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Terms
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/60">
          © {new Date().getFullYear()} Buuzzer Copilot. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
