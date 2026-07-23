import React from 'react';
import { appConfig } from '../data/appConfig';

const PlatformFeatures: React.FC = () => {
  const { features } = appConfig;

  return (
    <section className="bg-white py-16 lg:py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Comprehensive Platform Features</h2>
          <p className="text-slate-500 text-lg">Everything you need for clinical pharmacology project management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-6 lg:p-10 shadow-lg border border-gray-100 flex flex-col items-start hover:shadow-xl transition-shadow duration-200">
              <div className="w-14 h-14 bg-[#1e3a8a] text-white font-bold flex items-center justify-center text-xl mb-6 select-none shrink-0">
                {feature.id}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;