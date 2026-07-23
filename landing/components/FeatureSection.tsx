import React from 'react';
import { Sparkles } from 'lucide-react';

const FeatureSection: React.FC = () => {
  return (
    <section className="bg-brand-dark py-24 px-6 text-center relative overflow-hidden">
      
      <div className="absolute top-10 left-1/4 opacity-50">
         <Sparkles className="w-16 h-16 text-brand-accent fill-current" />
      </div>
      <div className="absolute bottom-10 right-1/4 opacity-50">
         <Sparkles className="w-10 h-10 text-blue-400 fill-current" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <h4 className="text-brand-accent font-bold tracking-widest text-sm uppercase mb-4">
          Built for Discovery
        </h4>
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Amplify researcher impact,<br />
          unlock therapeutic potential
        </h2>
      </div>
    </section>
  );
};

export default FeatureSection;