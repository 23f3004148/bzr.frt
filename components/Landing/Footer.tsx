import React from 'react';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-xl font-bold tracking-tight">Buuzzer</div>
          <p className="text-sm text-slate-300">
            Privacy-first AI interview assistant. No team photos—just the product.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          © {year} Buuzzer. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
