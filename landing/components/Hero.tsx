import React from 'react';
import { appConfig } from '../data/appConfig';

const Hero: React.FC = () => {
  const { hero, company } = appConfig;

  return (
    <section className="relative overflow-hidden min-h-[700px] flex items-center bg-[#020617]">
      
      {/* Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Animated Glowing Orbs (Screen blend for dark mode) */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full animate-blob"></div>
        <div className="absolute top-[10%] right-[0%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-blob-slow animation-delay-4000"></div>

        {/* Diagonal Light Streak */}
        <div className="absolute top-[-50%] right-[55%] w-[1px] h-[200%] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent transform rotate-[22deg] blur-[0.5px]"></div>
        <div className="absolute top-[-50%] right-[45%] w-[1px] h-[200%] bg-gradient-to-b from-transparent via-purple-500/20 to-transparent transform rotate-[22deg] blur-[0.5px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        
        {/* Left Content */}
        <div className="max-w-4xl">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase mb-6 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-blue-400"></span>
            {hero.label}
          </p>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.05] mb-8 tracking-tight drop-shadow-2xl">
            {hero.titlePrefix} 
            <span className="block text-transparent bg-clip-text bg-blue-300 mt-2 lg:mt-0"> {hero.titleHighlight}</span>
          </h1>
          
          <p className="text-lg text-slate-300 mb-12 leading-relaxed max-w-xl font-light border-l-2 border-slate-700 pl-6">
            {hero.description}
          </p>
          
          {/* Dark Glass Card */}
          <div className="bg-slate-900/40 backdrop-blur-sm p-8 border border-white/10 relative group max-w-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-xl font-semibold text-white mb-2 relative z-10">
              Ready to transform your pharmacometrics workflow?
            </h3>
            <a 
              href={company.links.register}
              className="relative z-10 bg-white text-slate-950 px-8 py-3 font-bold text-sm hover:bg-blue-50 transition-colors w-auto inline-block"
            >
              {hero.cta}
            </a>
          </div>
        </div>
        
        {/* Right Area - Placeholder for visual balance */}
        <div className="hidden lg:block h-[500px]">
          {/* We can keep this empty to let the background grids and blobs show through, 
              or add a subtle data visualization graphic later */}
        </div>

      </div>
    </section>
  );
};

export default Hero;