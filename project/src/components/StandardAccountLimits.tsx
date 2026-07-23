import React from 'react';
import { Lock } from 'lucide-react';

const StandardAccountLimits: React.FC = () => {
  return (
    <div className="bg-blue-50 border-t border-b border-blue-200 p-4">
      <div className="flex items-start space-x-4">
        <div className="bg-blue-100 p-2 mt-1 flex-shrink-0 rounded-md">
          <Lock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Standard Account Limits</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            As a standard research member, you have restricted access to multi-user collaboration tools, model execution, and AI assistant features. Upgrade to a premium plan to unlock these features.
          </p>
          <a
            href="https://app.drlevy.ai/#/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm rounded-md"
          >
            EXPLORE PREMIUM FEATURES
          </a>
        </div>
      </div>
    </div>
  );
};

export default StandardAccountLimits;
