import React from 'react';
import { CircleAlert } from 'lucide-react';
import { appConfig } from '../data/appConfig';

interface NavbarProps {
  onNavigate?: (page: 'home' | 'solutions' | 'terms') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { company } = appConfig;

  // Helper to handle navigation if prop is provided, otherwise fallback to href
  const handleNav = (e: React.MouseEvent, page: 'home' | 'solutions' | 'terms') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(page);
    }
  };

  return (
    <nav className="bg-white py-4 px-6 lg:px-12 flex items-center justify-between font-sans border-b border-gray-100 relative z-50">
      {/* Left: Logo and Brand */}
      <div className="flex items-center gap-4">
        <a href="/" onClick={(e) => handleNav(e, 'home')} className="flex items-center gap-4">
          <img src={company.logoUrl} alt={company.name} className="h-6 w-auto" />
          <div className="h-5 w-px bg-slate-400"></div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight">{company.fullName}</span>
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
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        
        {/* Get Started - Link to Register */}
        <a 
          href={company.links.register}
          className="bg-brand-primary text-white px-5 py-2 text-sm font-semibold hover:bg-brand-secondary transition-colors inline-block"
        >
          Get started
        </a>
        
        {/* Sign In - Link to Login */}
        <a 
          href={company.links.login}
          className="bg-white border border-slate-800 text-slate-800 px-5 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors inline-block"
        >
          Sign in
        </a>

        {/* Request Demo - Black with Alert Icon */}
        <a 
          href={company.links.demoHash}
          className="bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm group cursor-pointer"
        >
          <CircleAlert size={16} className="text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
          <span>Request Demo</span>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;