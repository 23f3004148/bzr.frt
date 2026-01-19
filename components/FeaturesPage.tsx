import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AppState } from '../types';

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onBack?: () => void;
}

export const FeaturesPage: React.FC<PageProps> = ({ onLogin, onNavigate, onBack }) => {
  const features = [
    {
      title: 'Real‑Time Transcription',
      desc: 'Capture every detail with high‑accuracy transcription so the assistant never loses context.',
    },
    {
      title: 'Answer Suggestions',
      desc: 'Get concise, interview‑ready answers tailored to the question and your resume.',
    },
    {
      title: 'Session Timer & Focus',
      desc: 'Stay paced and consistent with built‑in timing and clean, distraction‑free UI.',
    },
    {
      title: 'Meetings & Mentor Sessions',
      desc: 'Join live sessions and track schedules from a polished dashboard.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--bg))] text-slate-950">
      <Header onNavigate={onNavigate} onLogin={onLogin} onBack={onBack} />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight">Features</h1>
            <p className="mt-3 text-slate-600">
              Everything you need for polished, consistent interview performance — without clutter.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-lg font-semibold">{f.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate(AppState.HOW_IT_WORKS)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              How it works
            </button>
            <button
              onClick={() => onNavigate(AppState.CONTACT)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Contact
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
