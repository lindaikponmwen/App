import React from 'react';
import { Briefcase, BarChart2, Activity, ArrowRight, LayoutDashboard, Database, LineChart, RefreshCw } from 'lucide-react';
import { appConfig } from '../data/appConfig';

const SolutionsPage: React.FC = () => {
  const { solutions } = appConfig;

  // Helper to map icon string to Component
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-8 h-8 text-white" />;
      case 'Database': return <Database className="w-8 h-8 text-white" />;
      case 'Activity': return <Activity className="w-8 h-8 text-white" />;
      default: return <BarChart2 className="w-8 h-8 text-white" />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Section for Solutions */}
      <div className="bg-[#020617] text-white py-24 px-6 relative overflow-hidden">
        {/* Background Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            The DrLevy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Suite</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            Three powerful applications. One unified platform. Designed specifically for the modern pharmacometrician.
          </p>

          {/* Workflow Retention Message */}
          <div className="max-w-3xl mx-auto bg-blue-900/20 border-l-4 border-blue-500 p-6 text-left backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <RefreshCw className="text-blue-400 w-8 h-8 shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Seamless Integration</h3>
                <p className="text-slate-300 leading-relaxed">
                  Retain your current workflow process and files. Our suite is engineered with advanced tools to integrate seamlessly into your existing environment, ensuring a smooth transition without disrupting your established methods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {solutions.map((sol) => (
            <div key={sol.id} className="bg-white border border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full group">
              {/* Card Header */}
              <div className={`${sol.colorClass} p-6 flex items-center justify-between`}>
                <div className="bg-white/20 p-3 backdrop-blur-sm">
                  {getIcon(sol.icon)}
                </div>
                <div className="text-right">
                  <h3 className="text-white font-bold text-xl tracking-wide">{sol.title}</h3>
                  <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest opacity-90">{sol.subtitle}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8 flex-1 flex flex-col">
                <p className="text-slate-600 leading-relaxed mb-8 flex-1">
                  {sol.description}
                </p>

                {/* Feature List */}
                <ul className="space-y-3 mb-8">
                  {sol.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <div className="w-1.5 h-1.5 bg-brand-primary"></div>
                      {feat}
                    </li>
                  ))}
                </ul>

                <a 
                  href="https://app.drlevy.ai/"
                  className="w-full border-2 border-slate-900 text-slate-900 py-3 font-bold hover:bg-slate-900 hover:text-white transition-colors flex items-center justify-center gap-2 group-hover:gap-4 duration-300"
                >
                  Launch App <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Banner */}
      <div className="max-w-7xl mx-auto px-6 mt-24">
        <div className="bg-white border-l-4 border-brand-primary p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Seamless Integration</h3>
            <p className="text-slate-600 max-w-xl">
              All three apps share a common data lake. Upload your dataset once in the Project App, explore it in the Data App, and run diagnostics in the Model App without ever moving files manually.
            </p>
          </div>
          <div className="flex gap-4">
             <LayoutDashboard className="text-slate-300" size={48} />
             <ArrowRight className="text-slate-300" size={48} />
             <LineChart className="text-brand-primary" size={48} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;