import React, { useState, useEffect } from 'react';
import { Loader2, Eye } from 'lucide-react';
import DCAplanDetails from './DCAPlanDetail';

interface DCAPlan {
  id: string;
  userId: string;
  amount: number;
  frequency: string;
  interval: number;
  risk: string;
  toAddress: string;
  transactionHash: string;
  tokenDenom: string;
  createdAt: string;
  status: string;
  nextExecutionTime?: string;
  executionHistory?: {
    date: string;
    status: string;
    amount: number;
    transactionHash?: string;
    error?: string;
  }[];
}

interface ViewDCAPlansProps {
  userId: string | null;
  apiBaseUrl?: string;
  onCreateNew?: () => void;
  onBack?: () => void;
}

const ViewDCAPlans: React.FC<ViewDCAPlansProps> = ({
  userId,
  apiBaseUrl = "http://localhost:8000/api",
  onCreateNew,
  onBack
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<DCAPlan[]>([]);
  const [totalInvestment, setTotalInvestment] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DCAPlan | null>(null);

  useEffect(() => {
    const effectiveUserId = userId || localStorage.getItem('userId');
    
    if (!effectiveUserId) {
      setError("User ID not available. Please connect your wallet.");
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch DCA plans
        const plansResponse = await fetch(`${apiBaseUrl}/dca/users/${effectiveUserId}/plans`);
        
        if (!plansResponse.ok) {
          throw new Error("Failed to fetch DCA plans");
        }
        
        let plansData = await plansResponse.json();
        
        // Handle different API response structures by normalizing data
        if (Array.isArray(plansData)) {
          // Process each plan to ensure required fields are present
          plansData = plansData.map(plan => ({
            id: plan.id || plan._id || `plan-${Math.random().toString(36).substr(2, 9)}`,
            userId: plan.userId || effectiveUserId,
            amount: parseFloat(plan.amount) || 0,
            frequency: plan.frequency || "minutes",
            interval: parseInt(plan.interval) || 1,
            risk: plan.risk || "low",
            toAddress: plan.toAddress || plan.recipient || "",
            transactionHash: plan.transactionHash || "",
            tokenDenom: plan.tokenDenom || "USDT",
            createdAt: plan.createdAt || new Date().toISOString(),
            status: plan.status || "active"
          }));
        } else if (plansData && typeof plansData === 'object') {
          // If response is an object with plans array inside
          plansData = Array.isArray(plansData.plans) ? plansData.plans : [plansData];
        } else {
          // If no valid data, set empty array
          plansData = [];
        }
        
        setPlans(plansData);
        
        // Fetch total investment
        try {
          const investmentResponse = await fetch(`${apiBaseUrl}/dca/users/${effectiveUserId}/total-investment`);
          
          if (investmentResponse.ok) {
            const investmentData = await investmentResponse.json();
            // Handle different response structures
            const totalValue = investmentData.totalInvestment || 
                              investmentData.total || 
                              (typeof investmentData === 'number' ? investmentData : 0);
            
            setTotalInvestment(totalValue);
          } else {
            // If total investment endpoint fails, calculate from plans
            const totalFromPlans = plansData.reduce((sum: number, plan: { amount: any; }) => sum + parseFloat(plan.amount || 0), 0);
            setTotalInvestment(totalFromPlans);
          }
        } catch (investErr) {
          console.error("Error fetching investment data:", investErr);
          // Calculate from plans as fallback
          const totalFromPlans = plansData.reduce((sum: number, plan: { amount: any; }) => sum + parseFloat(plan.amount || 0), 0);
          setTotalInvestment(totalFromPlans);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError((err as Error).message);
        
        // For demo purposes - add sample data if API fails
        const samplePlan = {
          id: `plan-${Math.random().toString(36).substr(2, 9)}`,
          userId: effectiveUserId,
          amount: 10,
          frequency: "minutes",
          interval: 1,
          risk: "low",
          toAddress: "inj1wmm1uump3mtt34e0j3p2gqjxks98rpnywy8lzh",
          transactionHash: "5891536707AC677088CB2227EFE319D72670D597FB599228A86EA76FE4BD22FA",
          tokenDenom: "USDT",
          createdAt: new Date().toISOString(),
          status: "active"
        };
        setPlans([samplePlan]);
        setTotalInvestment(10);
        setError("Using demo data. API connection failed.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId, apiBaseUrl]);

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to format frequency
  const formatFrequency = (interval: number, frequency: string) => {
    // Make sure interval is displayed
    const intervalDisplay = interval || 'undefined';
    
    // Handle singular/plural for frequency
    let unit = frequency;
    if (frequency === "minute" || frequency === "hour" || frequency === "day") {
      unit = interval === 1 ? frequency : `${frequency}s`;
    }
    
    return `Every ${intervalDisplay} ${unit}`;
  };

  // Function to format status with colored badge
  const renderStatus = (status: string) => {
    let bgColor = "bg-gray-500";
    
    if (status === "active") {
      bgColor = "bg-green-500";
    } else if (status === "paused") {
      bgColor = "bg-yellow-500";
    } else if (status === "completed") {
      bgColor = "bg-blue-500";
    } else if (status === "failed") {
      bgColor = "bg-red-500";
    }
    
    return (
      <span className={`${bgColor} text-white text-xs px-2 py-1 rounded-full uppercase`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
      <div className="py-4 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10">
        <div>
          <h3 className="text-2xl font-bold">Your DCA Plans</h3>
          <p className="text-gray-400">Manage your automated USDT swap transactions</p>
        </div>
        
        {totalInvestment !== null && (
          <div className="bg-gray-900 px-4 py-3 rounded">
            <p className="text-sm text-gray-400">Total Invested</p>
            <p className="text-2xl font-bold">{totalInvestment.toFixed(2)} USDT</p>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/50 text-red-300 border border-red-800 rounded-md m-6">
            <p>{error}</p>
            <button 
              onClick={onBack} 
              className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
            >
              Go Back
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4">You don't have any active DCA plans yet.</p>
            <button 
              onClick={onCreateNew} 
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Create Your First Plan
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left py-4 px-6 font-medium">Amount</th>
                    <th className="text-left py-4 px-6 font-medium">Frequency</th>
                    <th className="text-left py-4 px-6 font-medium">Risk</th>
                    <th className="text-left py-4 px-6 font-medium">Recipient</th>
                    <th className="text-left py-4 px-6 font-medium">Created</th>
                    <th className="text-left py-4 px-6 font-medium">Status</th>
                    {/* <th className="text-left py-4 px-6 font-medium">Next Execution</th> */}
                    <th className="text-left py-4 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-white/5 border-b border-white/5">
                      <td className="py-4 px-6">
                        <div className="font-medium">{plan.amount.toFixed(2)}</div>
                        <div className="text-gray-400">USDT</div>
                      </td>
                      <td className="py-4 px-6">
                        {formatFrequency(plan.interval, plan.frequency)}
                      </td>
                      <td className="py-4 px-6 capitalize">
                        {plan.risk || "low"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-400 truncate max-w-[160px]">
                          {plan.toAddress}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {formatDate(plan.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        {renderStatus(plan.status)}
                      </td>
                      {/* <td className="py-4 px-6">
                        {"-"}
                      </td> */}
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 hover:bg-gray-700 rounded">
                            Pause
                          </button>
                          <button className="px-3 py-1 text-red-400 hover:bg-red-900/30 rounded">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between p-6">
              <button
                onClick={onBack}
                className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={onCreateNew}
                className="px-6 py-2 bg-white text-black rounded font-medium hover:bg-white/90 transition-colors"
              >
                Create New Plan
              </button>
            </div>
            
            {selectedPlan && (
              <DCAplanDetails
                plan={selectedPlan}
                onClose={() => setSelectedPlan(null)}
                onPause={(id) => {
                  console.log("Pause plan:", id);
                  setSelectedPlan(null);
                }}
                onResume={(id) => {
                  console.log("Resume plan:", id);
                  setSelectedPlan(null);
                }}
                onCancel={(id) => {
                  console.log("Cancel plan:", id);
                  setSelectedPlan(null);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDCAPlans;