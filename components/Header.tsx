import React, { useState } from 'react';
import { Button } from './Button';
import { AppState } from '../types';

interface HeaderProps {
  onNavigate: (state: AppState) => void;
  onLogin: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onLogin, onBack }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sky-100 bg-[rgba(224,242,255,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition"
              aria-label="Go Back"
            >
              ←
            </button>
          )}

          <button
            className="flex items-center gap-3"
            onClick={() => onNavigate(AppState.LANDING)}
            aria-label="Go to home"
          >
            <img src="/buzzer-full-logo.svg" alt="BUUZZER" className="h-12 w-auto" />
          </button>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-7 text-sm font-medium text-slate-700">
            <button className="hover:text-slate-950 transition" onClick={() => onNavigate(AppState.FEATURES)}>
              Features
            </button>
            <button className="hover:text-slate-950 transition" onClick={() => onNavigate(AppState.HOW_IT_WORKS)}>
              How it works
            </button>
            <button className="hover:text-slate-950 transition" onClick={() => onNavigate(AppState.CONTACT)}>
              Contact
            </button>
          </nav>

          <Button onClick={onLogin} variant="primary" className="px-5 py-2.5">
            Log in
          </Button>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200/70 bg-white/80 backdrop-blur-xl px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <button
              onClick={() => {
                onNavigate(AppState.FEATURES);
                setMobileMenuOpen(false);
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-100"
            >
              Features
            </button>
            <button
              onClick={() => {
                onNavigate(AppState.HOW_IT_WORKS);
                setMobileMenuOpen(false);
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-100"
            >
              How it works
            </button>
            <button
              onClick={() => {
                onNavigate(AppState.CONTACT);
                setMobileMenuOpen(false);
              }}
              className="rounded-xl px-3 py-2 text-left hover:bg-slate-100"
            >
              Contact
            </button>
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              variant="primary"
              className="mt-2"
            >
              Log in
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
