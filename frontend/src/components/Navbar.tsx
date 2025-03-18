import React from 'react';
import { Wallet2 } from 'lucide-react';
import Wallet from './Wallet';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Wallet2 className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">DCA Master</span>
          </div>
          <div className="w-48">
            <Wallet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;