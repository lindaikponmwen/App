import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PlatformFeatures from './components/PlatformFeatures';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import SolutionsPage from './components/SolutionsPage';
import TermsPage from './components/TermsPage';
import CookiePolicyPage from './components/CookiePolicyPage';
import CookieConsentModal from './components/CookieConsentModal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'solutions' | 'terms' | 'cookies'>('home');

  const handleNavigate = (page: 'home' | 'solutions' | 'terms' | 'cookies') => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar onNavigate={(page) => handleNavigate(page as any)} />
      
      <main>
        {currentPage === 'home' && (
          <>
            <Hero />
            <PlatformFeatures />
            <ContactForm />
          </>
        )}
        
        {currentPage === 'solutions' && (
          <SolutionsPage />
        )}

        {currentPage === 'terms' && (
          <TermsPage />
        )}

        {currentPage === 'cookies' && (
          <CookiePolicyPage />
        )}
      </main>

      <Footer onNavigate={(page) => handleNavigate(page as any)} />
      
      <CookieConsentModal onNavigate={(page) => handleNavigate(page)} />
    </div>
  );
};

export default App;