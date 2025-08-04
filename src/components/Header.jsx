import React from 'react';
import { Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-bold">vCon Info</h1>
              <span className="text-sm text-gray-400">Decode • Inspect • Validate</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://datatracker.ietf.org/group/vcon/documents/" className="text-blue-400 hover:text-blue-300 transition-colors">IETF vCon WG</a>
            <a href="https://github.com/quartzjer/vcon-info" className="text-blue-400 hover:text-blue-300 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;