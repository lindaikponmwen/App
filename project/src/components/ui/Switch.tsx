import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
  const spring = {
    type: 'spring',
    stiffness: 700,
    damping: 30,
  };

  return (
    <div
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
        checked ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
      }`}
      onClick={() => onChange(!checked)}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        {...{ layout: true, transition: spring } as any}
      />
    </div>
  );
};

export default Switch;