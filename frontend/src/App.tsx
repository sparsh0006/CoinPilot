import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreateDCAForm from './components/CreateDCAForm';
import ViewDCAPlans from './components/ViewDCAPlans';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'create', 'view'
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshPlans, setRefreshPlans] = useState(0); // To trigger refreshing plans on successful creation

  // Check for stored data on component mount
  useEffect(() => {
    const storedWalletAddress = localStorage.getItem('walletAddress');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedWalletAddress) setWalletAddress(storedWalletAddress);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const handleCreatePlan = () => {
    setCurrentView('create');
  };

  const handleViewPlans = () => {
    setCurrentView('view');
  };

  const backToOptions = () => {
    setCurrentView('home');
  };

  const handleDCASuccess = () => {
    console.log('DCA plan created successfully');
    setRefreshPlans(prev => prev + 1); // Increment to trigger a refresh
    setCurrentView('view');
  };

  const handleDCACancel = () => {
    console.log('DCA creation cancelled');
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
     
      {currentView === 'home' && (
        <div className="pt-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Automate Your Crypto Investment Strategy
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Dollar Cost Averaging (DCA) is a powerful investment strategy that helps reduce the impact of volatility by spreading out your purchases over time. Start your automated DCA journey today.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
              <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3">Automated Investing</h3>
                <p className="text-gray-400">Set up recurring purchases at your preferred intervals</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3">Risk Management</h3>
                <p className="text-gray-400">Reduce the impact of market volatility on your portfolio</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3">Full Control</h3>
                <p className="text-gray-400">Customize your DCA strategy to match your goals</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3">Mock Money</h3>
                <p className="text-gray-400">coming soon</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-3">Smart Pool</h3>
                <p className="text-gray-400">coming soon</p>
              </div>
            </div>

            {/* Always display buttons regardless of wallet connection */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleCreatePlan}
                className="bg-white text-black px-8 py-3 rounded-lg text-lg font-medium hover:bg-white/90 transition-colors"
              >
                Create DCA Plan
              </button>
              <button
                onClick={handleViewPlans}
                className="bg-white/10 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white/20 transition-colors"
              >
                View DCA Plans
              </button>
            </div>
          </div>
        </div>
      )}
      
      {currentView === 'create' && (
        <div className="pt-32 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Create DCA Plan</h2>
              <button 
                onClick={backToOptions}
                className="text-sm text-gray-400 hover:text-white"
              >
                ← Back to options
              </button>
            </div>
            <CreateDCAForm 
              walletAddress={walletAddress} 
              userId={userId} 
              onSuccess={handleDCASuccess} 
              onCancel={handleDCACancel} 
            />
          </div>
        </div>
      )}

      {currentView === 'view' && (
        <div className="pt-32 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Your DCA Plans</h2>
              <button 
                onClick={backToOptions}
                className="text-sm text-gray-400 hover:text-white"
              >
                ← Back to options
              </button>
            </div>
            
            <ViewDCAPlans 
              userId={userId}
              onCreateNew={handleCreatePlan}
              onBack={backToOptions}
              key={refreshPlans} // Forces re-render when a new plan is created
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;