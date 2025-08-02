import React from 'react';
import { Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">vCon Inspector</h1>
            <span className="text-sm text-gray-400">Decode • Inspect • Validate</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">IETF Draft</a>
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">Documentation</a>
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">GitHub</a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;