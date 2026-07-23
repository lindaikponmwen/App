import React from 'react';
import { Monitor, Smartphone, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileWarning() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Smartphone className="w-6 h-6 text-orange-500" />
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Desktop Experience Required
        </h1>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          DrLevy.AI is optimized for desktop and tablet devices to provide the best 
          research experience. Please access this platform from a larger screen for 
          optimal performance and functionality.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Recommended Devices:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Desktop computers</li>
            <li>• Laptops (13" or larger)</li>
            <li>• Tablets in landscape mode</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500">
          For technical support, please contact your system administrator.
        </div>
      </motion.div>
    </div>
  );
}