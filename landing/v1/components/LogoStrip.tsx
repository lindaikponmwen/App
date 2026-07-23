import React from 'react';

const LogoStrip: React.FC = () => {
  // Using placeholders for logos
  const logos = [
    "Pfizer-like", "Novartis-style", "Roche-esque", "Merck-ish", "Sanofi-sim", "GSK-twin"
  ];

  return (
    <section className="bg-white py-12 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center opacity-60 grayscale">
        {logos.map((name, idx) => (
            <div key={idx} className="text-xl font-serif font-bold text-slate-800 uppercase tracking-widest p-4">
                {name}
            </div>
        ))}
      </div>
    </section>
  );
};

export default LogoStrip;