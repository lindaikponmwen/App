import React from 'react';

const EmpoweringSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-orange-50/50 via-orange-100/30 to-white py-24 px-6 text-center relative">
      {/* Subtle top border blend */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-50 to-transparent opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h2 className="text-4xl lg:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">
          Empowering early-stage startups
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
          Accelerate innovation with the only pharmacometrics platform built for scale.
        </p>
      </div>
    </section>
  );
};

export default EmpoweringSection;