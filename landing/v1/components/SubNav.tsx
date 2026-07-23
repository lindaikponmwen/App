import React from 'react';

const SubNav: React.FC = () => {
  const links = [
    { name: 'Success stories', active: true },
    { name: 'Startup spotlight', active: false },
    { name: 'Blog', active: false },
    { name: 'Founder experiences', active: false },
    { name: 'Free access to tools', active: false },
    { name: 'Your partner in tech', active: false },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between h-auto lg:h-16 py-4 lg:py-0 gap-4">
          
          {/* Links */}
          <div className="flex items-center gap-8 overflow-x-auto w-full lg:w-auto no-scrollbar">
            {links.map((link) => (
              <a 
                key={link.name} 
                href="#" 
                className={`text-sm font-semibold whitespace-nowrap pb-1 lg:pb-0 ${
                  link.active 
                  ? 'text-brand-primary border-b-2 border-brand-primary lg:border-0 lg:relative lg:after:content-[""] lg:after:absolute lg:after:bottom-[-22px] lg:after:left-0 lg:after:w-full lg:after:h-[2px] lg:after:bg-brand-primary' 
                  : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Action */}
          <div className="hidden lg:block">
             <button className="bg-brand-primary text-white px-5 py-2 text-xs font-bold uppercase tracking-wide hover:bg-brand-secondary transition-colors">
               Get started now
             </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SubNav;