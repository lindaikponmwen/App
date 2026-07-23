import React from 'react';
import { appConfig } from '../data/appConfig';

const TermsPage: React.FC = () => {
  const { terms, company } = appConfig;

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b border-gray-200 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Legal & Privacy</h1>
          <p className="text-slate-500 text-lg">Last updated: {terms.lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        
        {/* Terms of Service */}
        <section>
          <h2 className="text-2xl font-bold text-brand-dark mb-6 border-b border-gray-100 pb-2">Terms of Service</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
            <p>
              Welcome to {company.name}. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
            {terms.sections.map((section, idx) => (
                <div key={idx}>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{section.title}</h3>
                    <p>{section.content}</p>
                </div>
            ))}
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-2xl font-bold text-brand-dark mb-6 border-b border-gray-100 pb-2">Privacy Policy</h2>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
            <p>
              At {company.name}, we take data privacy seriously, especially given the sensitive nature of clinical data. This policy outlines how we collect, use, and protect your information.
            </p>
             {terms.privacy.map((section, idx) => (
                <div key={idx}>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{section.title}</h3>
                    <p>{section.content}</p>
                </div>
            ))}
          </div>
        </section>

        <section className="bg-brand-primary/5 p-8 border border-brand-primary/10">
          <h3 className="font-bold text-brand-primary mb-2">Contact Legal Team</h3>
          <p className="text-slate-600 text-sm mb-4">
            If you have specific questions regarding our compliance with GDPR, HIPAA, or other regulations, please contact our legal department.
          </p>
          <a href={`mailto:${company.legalEmail}`} className="text-brand-dark font-bold hover:underline">{company.legalEmail}</a>
        </section>

      </div>
    </div>
  );
};

export default TermsPage;