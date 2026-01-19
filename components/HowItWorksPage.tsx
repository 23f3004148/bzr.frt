import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppState } from '../types';
import { Button } from './Button';

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onBack?: () => void;
}

export const HowItWorksPage: React.FC<PageProps> = ({ onLogin, onNavigate, onBack }) => {
  const steps = [
    {
      step: '01',
      title: 'Create a request',
      desc: 'Paste a job description and choose one of your saved resumes.',
    },
    {
      step: '02',
      title: 'Schedule & prepare',
      desc: 'Track upcoming sessions from a clean dashboard layout.',
    },
    {
      step: '03',
      title: 'Run the session',
      desc: 'Start an interview session and get real‑time, concise suggestions.',
    },
    {
      step: '04',
      title: 'Iterate',
      desc: 'Save multiple resumes and pick the most relevant one per role.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--bg))] text-slate-950">
      <Header onNavigate={onNavigate} onLogin={onLogin} onBack={onBack} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight">How it works</h1>
            <p className="mt-3 text-slate-600">
              A simple flow designed for speed, clarity and interview‑ready answers.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {steps.map((s) => (
              <div key={s.step} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="text-xs font-semibold tracking-widest text-slate-500">{s.step}</div>
                <div className="mt-2 text-xl font-semibold">{s.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="primary" onClick={onLogin}>
              Get started
            </Button>
            <Button variant="secondary" onClick={() => onNavigate(AppState.FEATURES)}>
              See features
            </Button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
