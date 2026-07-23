import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzePkData } from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';
import { appConfig } from '../data/appConfig';

// Mock PK Data
const data = [
  { time: 0, conc: 0 },
  { time: 1, conc: 15 },
  { time: 2, conc: 45 },
  { time: 3, conc: 38 },
  { time: 4, conc: 30 },
  { time: 6, conc: 18 },
  { time: 8, conc: 10 },
  { time: 12, conc: 4 },
  { time: 24, conc: 0.5 },
];

const AiDemoSection: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { aiDemo } = appConfig;

  const handleRunAnalysis = async () => {
    setLoading(true);
    const summary = aiDemo.initialSummary;
    const result = await analyzePkData(summary);
    setAnalysis(result);
    setLoading(false);
    setHasRun(true);
  };

  return (
    <section className="bg-white py-16 lg:py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        
        {/* Chart Area */}
        <div className="bg-gray-50 border border-gray-200 p-6 lg:p-8">
          <h3 className="text-lg md:text-xl font-bold text-brand-dark mb-2">{aiDemo.chartTitle}</h3>
          <p className="text-sm text-gray-600 mb-6">{aiDemo.chartSubtitle}</p>
          
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" label={{ value: 'Time (h)', position: 'insideBottomRight', offset: -5, style: { fontSize: '12px' } }} tick={{fontSize: 12}} />
                <YAxis label={{ value: 'Conc (mg/L)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '0px', border: '1px solid #7e22ce' }}
                  itemStyle={{ color: '#7e22ce' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conc" 
                  stroke="#7e22ce" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#7e22ce' }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Control Area */}
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{aiDemo.title}</h3>
          <p className="text-slate-600 mb-8 text-base md:text-lg">
            {aiDemo.description}
          </p>

          {!hasRun ? (
            <div className="bg-gray-100 p-6 md:p-8 border border-gray-200">
              <p className="font-mono text-xs md:text-sm text-gray-500 mb-4">
                > Awaiting input stream... <br/>
                > Ready for analysis.
              </p>
              <button 
                onClick={handleRunAnalysis}
                disabled={loading}
                className="w-full bg-brand-primary text-white font-bold py-4 hover:bg-brand-dark transition-none flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Run AI Analysis"}
              </button>
            </div>
          ) : (
            <div className="bg-brand-cream border-l-4 border-brand-primary p-6">
              <h4 className="font-bold text-brand-primary mb-2 flex items-center gap-2">
                <Sparkles size={18} /> AI Analysis Result
              </h4>
              <p className="text-slate-800 leading-relaxed text-sm md:text-base">
                {analysis}
              </p>
              <button 
                onClick={() => setHasRun(false)}
                className="mt-6 text-sm font-bold text-brand-dark underline"
              >
                Reset Simulation
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default AiDemoSection;