import React from 'react';
import { Github, Twitter, Linkedin, Mail, MapPin } from 'lucide-react';
import { appConfig } from '../data/appConfig';

interface FooterProps {
  onNavigate?: (page: 'home' | 'solutions' | 'terms' | 'cookies') => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { company } = appConfig;

  const handleNav = (e: React.MouseEvent, page: 'home' | 'solutions' | 'terms' | 'cookies') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(page);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-16 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand & Contact */}
        <div className="col-span-1 md:col-span-1">
          <div className="mb-6 flex items-center gap-3">
            <img src={company.logoUrl} alt={company.name} className="h-8 w-auto" />
            <div className="h-6 w-px bg-slate-300"></div>
            <span className="font-semibold text-slate-900 tracking-tight leading-none">{company.fullName}</span>
          </div>
          
          <div className="space-y-4 text-sm text-slate-600 mt-8">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-primary shrink-0 mt-0.5" />
              <span>{company.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-brand-primary shrink-0" />
              <a href={`mailto:${company.email}`} className="hover:text-brand-primary transition-colors">{company.email}</a>
            </div>
          </div>
        </div>

        {/* Navigation - Platform */}
        <div>
          <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest border-b border-gray-100 pb-2 inline-block">Platform</h5>
          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li>
                <a href="/" onClick={(e) => handleNav(e, 'home')} className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  Home
                </a>
            </li>
            <li>
                <a href="/solutions" onClick={(e) => handleNav(e, 'solutions')} className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  Solutions
                </a>
            </li>
            <li>
                <a href={company.links.docs} className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  Documentation
                </a>
            </li>
          </ul>
        </div>

        {/* Navigation - Company */}
        <div>
          <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest border-b border-gray-100 pb-2 inline-block">Company</h5>
          <ul className="space-y-4 text-sm text-slate-600 font-medium">
            <li>
                <a href={company.links.about} target="_blank" rel="noreferrer" className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  About Us
                </a>
            </li>
            <li>
                <a href="/terms" onClick={(e) => handleNav(e, 'terms')} className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  Terms & Privacy
                </a>
            </li>
            <li>
                <a href="/cookies" onClick={(e) => handleNav(e, 'cookies')} className="hover:text-brand-primary transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-300 group-hover:bg-brand-primary transition-colors"></span>
                  Cookie Notice
                </a>
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest border-b border-gray-100 pb-2 inline-block">Connect</h5>
          <div className="flex gap-4 mb-8">
            <a href={company.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="bg-slate-50 border border-slate-200 p-3 text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
              <Linkedin size={20} />
            </a>
            <a href={company.social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter / X" className="bg-slate-50 border border-slate-200 p-3 text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
              <Twitter size={20} />
            </a>
            <a href={company.social.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="bg-slate-50 border border-slate-200 p-3 text-slate-600 hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all">
              <Github size={20} />
            </a>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            © 2026 {company.legalName}<br/>
            {company.tagline}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;