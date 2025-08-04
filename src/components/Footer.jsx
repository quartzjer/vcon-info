import React from 'react';
import { Lock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 flex-shrink-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>All validation happens client-side. Your data never leaves your browser.</span>
          </div>
          <div className="text-center sm:text-right">
            <span>Built with ❤️ for the vCon community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;