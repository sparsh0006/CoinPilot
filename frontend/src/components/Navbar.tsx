import React from 'react';
import { Wallet2 } from 'lucide-react';
import KeplrWallet from './KeplrWallet';

interface NavbarProps {
  onConnect: (address: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onConnect }) => {
  const handleConnect = (address: string, userId: string) => {
    console.log('Wallet connected:', address, 'userId:', userId);
    // Call the parent component's onConnect function
    if (onConnect) {
      onConnect(address);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Wallet2 className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">DCA Master</span>
          </div>
          <div className="w-48">
            <KeplrWallet onConnect={handleConnect} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;