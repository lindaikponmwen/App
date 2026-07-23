import React, { useState, useEffect } from 'react';
import { CircleAlert, Menu, X } from 'lucide-react';
import { appConfig } from '../data/appConfig';

interface NavbarProps {
  onNavigate?: (page: 'home' | 'solutions' | 'terms') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { company } = appConfig;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleNav = (e: React.MouseEvent, page: 'home' | 'solutions' | 'terms') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white py-4 px-6 lg:px-12 font-sans border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between relative z-50 bg-white">
        {/* Left: Logo and Brand */}
        <a href="/" onClick={(e) => handleNav(e, 'home')} className="flex items-center gap-4">
          <img src={company.logoUrl} alt={company.name} className="h-6 w-auto" />
          <div className="h-5 w-px bg-slate-400 hidden sm:block"></div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight hidden sm:block">{company.fullName}</span>
          <span className="font-semibold text-slate-800 text-lg tracking-tight sm:hidden">DrLevy.AI</span>
        </a>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6 ml-6 text-sm text-slate-700 font-medium">
          <a 
            href="/solutions" 
            onClick={(e) => handleNav(e, 'solutions')}
            className="hover:underline hover:text-brand-primary decoration-2 underline-offset-4 cursor-pointer"
          >
            Solutions
          </a>
          <a href={company.links.docs} className="hover:underline hover:text-brand-primary decoration-2 underline-offset-4">
            Documentation
          </a>
          <a 
            href={company.links.about}
            className="hover:underline hover:text-brand-primary decoration-2 underline-offset-4"
          >
            About
          </a>
          <a 
            href="/terms" 
            onClick={(e) => handleNav(e, 'terms')}
            className="hover:underline hover:text-brand-primary decoration-2 underline-offset-4 cursor-pointer"
          >
            Terms
          </a>
        </div>

        {/* Right: Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <a href={company.links.register} className="bg-brand-primary text-white px-5 py-2 text-sm font-semibold hover:bg-brand-secondary transition-colors inline-block">
            Get started
          </a>
          <a href={company.links.login} className="bg-white border border-slate-800 text-slate-800 px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors inline-block">
            Sign in
          </a>
          <a href={company.links.demoHash} className="bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm group cursor-pointer">
            <CircleAlert size={16} className="text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
            <span>Request Demo</span>
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
            className="lg:hidden text-slate-800 p-2 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
        >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-24 px-6 flex flex-col gap-8 animate-in fade-in duration-200 lg:hidden overflow-y-auto">
             <div className="flex flex-col gap-6 text-lg font-medium text-slate-800">
                <a href="/" onClick={(e) => handleNav(e, 'home')} className="border-b border-gray-100 pb-2">Home</a>
                <a href="/solutions" onClick={(e) => handleNav(e, 'solutions')} className="border-b border-gray-100 pb-2">Solutions</a>
                <a href={company.links.docs} className="border-b border-gray-100 pb-2">Documentation</a>
                <a href={company.links.about} className="border-b border-gray-100 pb-2">About</a>
                <a href="/terms" onClick={(e) => handleNav(e, 'terms')} className="border-b border-gray-100 pb-2">Terms</a>
            </div>
            
            <div className="flex flex-col gap-4 mt-auto mb-10 pb-10">
                 <a href={company.links.register} className="bg-brand-primary text-white px-5 py-4 text-center font-bold text-lg hover:bg-brand-secondary">
                    Get started
                 </a>
                 <a href={company.links.login} className="bg-white border border-slate-800 text-slate-800 px-5 py-4 text-center font-bold text-lg hover:bg-gray-50">
                    Sign in
                 </a>
                 <a href={company.links.demoHash} className="bg-black text-white px-5 py-4 text-center font-bold text-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                    <CircleAlert size={20} className="text-yellow-400 fill-yellow-400" />
                    Request Demo
                 </a>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;