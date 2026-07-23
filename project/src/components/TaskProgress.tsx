import React from 'react';
import { CheckCircle2, Loader2, XCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step } from '../types';

interface TaskProgressProps {
  steps: Step[];
}

const getStatusIcon = (status: Step['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'in_progress':
      return <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />;
    case 'pending':
      return <Circle className="w-5 h-5 text-gray-400" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return null;
  }
};

const TaskProgress: React.FC<TaskProgressProps> = ({ steps }) => {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm mb-3 text-gray-700">I am diligently working on your request. Take a short coffee and come back, I should be all done.</p>
      <AnimatePresence>
        <motion.ul
          {...{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5 }
          } as any}
        >
          {steps.map((step, index) => (
            <motion.li
              key={step.label}
              className={`flex items-center space-x-3 py-1.5 text-sm ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'}`}
              {...{
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: index * 0.1 }
              } as any}
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {getStatusIcon(step.status)}
              </div>
              <span className={step.status === 'completed' ? 'text-gray-500' : 'font-medium'}>
                {step.label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
};

export default TaskProgress;