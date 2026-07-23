import React from 'react';
import { appConfig } from '../data/appConfig';

const CookiePolicyPage: React.FC = () => {
  const { cookiePolicy } = appConfig;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-gray-200 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Cookie Notice</h1>
          <p className="text-slate-500 text-lg">Last updated: {cookiePolicy.lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
          <p className="text-lg font-light">{cookiePolicy.intro}</p>
          
          {cookiePolicy.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-slate-900 text-xl mb-3">{section.title}</h3>
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          ))}
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-sm text-gray-500 italic">
            Last Modified: {cookiePolicy.lastUpdated}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;