import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: ReactNode;
  defaultOpen?: boolean;
  rounded?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, description, icon: Icon, children, defaultOpen = true, rounded = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-200 ${rounded ? 'rounded-xl' : ''} overflow-hidden bg-white`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <Icon className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900 text-left">{title}</h3>
            <p className="text-sm text-gray-500 text-left">{description}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            className="overflow-hidden"
            {...{
              initial: "collapsed",
              animate: "open",
              exit: "collapsed",
              variants: {
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
              },
              transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }
            } as any}
          >
            <div className="p-6 bg-gray-50/50 border-t border-gray-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;