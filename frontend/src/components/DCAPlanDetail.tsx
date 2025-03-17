import React from 'react';
import { X } from 'lucide-react';

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

interface DCAplanDetailsProps {
  plan: DCAPlan;
  onClose: () => void;
  onPause?: (planId: string) => void;
  onResume?: (planId: string) => void;
  onCancel?: (planId: string) => void;
}

const DCAplanDetails: React.FC<DCAplanDetailsProps> = ({
  plan,
  onClose,
  onPause,
  onResume,
  onCancel
}) => {
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to format frequency
  const formatFrequency = (interval: number, frequency: string) => {
    if (interval === 1) {
      return `Every ${frequency}`;
    }
    return `Every ${interval} ${frequency}s`;
  };

  // Sample execution history if not provided
  const executionHistory = plan.executionHistory || [
    {
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      status: 'completed',
      amount: plan.amount,
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    },
    {
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      status: 'completed',
      amount: plan.amount,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-white/10 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-semibold">DCA Plan Details</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400">Plan ID</h4>
                <p className="text-sm font-mono">{plan.id}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Amount</h4>
                <p className="text-xl font-bold">{plan.amount.toFixed(2)} USDT</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Frequency</h4>
                <p>{formatFrequency(plan.interval, plan.frequency)}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Risk Level</h4>
                <p className="capitalize">{plan.risk}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400">Created At</h4>
                <p>{formatDate(plan.createdAt)}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Status</h4>
                <p>
                  <span className={`
                    ${plan.status === 'active' ? 'bg-green-500' : 
                      plan.status === 'paused' ? 'bg-yellow-500' : 
                      plan.status === 'completed' ? 'bg-blue-500' : 
                      plan.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                    } 
                    text-white text-xs px-2 py-1 rounded-full uppercase`}>
                    {plan.status}
                  </span>
                </p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Next Execution</h4>
                <p>{plan.nextExecutionTime ? formatDate(plan.nextExecutionTime) : '-'}</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-400">Recipient Address</h4>
                <p className="text-sm font-mono truncate">{plan.toAddress}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-3">Transaction Details</h4>
            <div className="bg-white/5 p-4 rounded-lg">
              <h5 className="text-sm text-gray-400 mb-1">Initial Transaction Hash</h5>
              <p className="text-sm font-mono break-all">{plan.transactionHash}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-3">Execution History</h4>
            {executionHistory.length > 0 ? (
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Transaction Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {executionHistory.map((execution, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="py-3 px-4 text-sm">
                          {formatDate(execution.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`
                            ${execution.status === 'completed' ? 'bg-green-500' : 
                              execution.status === 'pending' ? 'bg-yellow-500' : 
                              execution.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                            } 
                            text-white text-xs px-2 py-1 rounded-full uppercase`}>
                            {execution.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {execution.amount.toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-4 text-sm font-mono truncate max-w-[200px]">
                          {execution.transactionHash || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-400 p-4 bg-white/5 rounded-lg">
                No execution history available yet
              </p>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10 flex flex-wrap gap-4 justify-end">
          {plan.status === 'active' && onPause && (
            <button
              onClick={() => onPause(plan.id)}
              className="px-4 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Pause Plan
            </button>
          )}
          
          {plan.status === 'paused' && onResume && (
            <button
              onClick={() => onResume(plan.id)}
              className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Resume Plan
            </button>
          )}
          
          {(plan.status === 'active' || plan.status === 'paused') && onCancel && (
            <button
              onClick={() => onCancel(plan.id)}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Cancel Plan
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DCAplanDetails;