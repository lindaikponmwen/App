import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appConfig } from '../data/appConfig';

interface CookieConsentModalProps {
  onNavigate?: (page: 'cookies') => void;
}

const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('drlevy_cookie_consent');
    if (!consent) {
      // Small delay for better UX on load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('drlevy_cookie_consent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    // In a real app, this might set a specific flag for essential cookies only
    localStorage.setItem('drlevy_cookie_consent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 md:p-8 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
        
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-lg mb-2">We value your privacy</h4>
          <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
            By clicking "Accept All", you consent to our use of cookies. 
            Read our <button onClick={() => onNavigate && onNavigate('cookies')} className="text-brand-primary underline hover:text-brand-dark font-medium">Cookie Notice</button> to learn more.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto min-w-fit">
           <button 
            onClick={handleDecline}
            className="px-6 py-3 border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors bg-white whitespace-nowrap"
          >
            Reject Non-Essential
          </button>
          <button 
            onClick={handleAccept}
            className="px-6 py-3 bg-brand-primary text-white font-bold text-sm hover:bg-brand-secondary transition-colors whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;