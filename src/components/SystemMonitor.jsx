import { useState, useEffect } from 'react';
import { getCircuitBreakerStats, resetCircuitBreaker } from '../localAssetsLoader';

export default function SystemMonitor({ isVisible = false }) {
  const [stats, setStats] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setStats(getCircuitBreakerStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getStateColor = (state) => {
    switch (state) {
      case 'CLOSED': return 'text-green-500';
      case 'OPEN': return 'text-red-500';
      case 'HALF_OPEN': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm hover:bg-gray-700 transition-colors"
      >
        🔧 System Monitor
      </button>
      
      {isExpanded && stats && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white p-4 rounded-lg shadow-xl min-w-80 text-sm">
          <h3 className="font-bold mb-3 text-blue-300">Sistema Híbrido Status</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Circuit Breaker:</span>
              <span className={`font-bold ${getStateColor(stats.state)}`}>
                {stats.state}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Falhas:</span>
              <span className={stats.failureCount > 0 ? 'text-red-400' : 'text-green-400'}>
                {stats.failureCount}
              </span>
            </div>
            
            {stats.lastFailureTime && (
              <div className="flex justify-between items-center">
                <span>Última Falha:</span>
                <span className="text-gray-400 text-xs">
                  {new Date(stats.lastFailureTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={() => {
                resetCircuitBreaker();
                setStats(getCircuitBreakerStats());
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs transition-colors"
            >
              Resetar Circuit Breaker
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            <div>🏠 Local: Imagens servidas do /public</div>
            <div>🌐 API: Fallback para Cloudinary</div>
          </div>
        </div>
      )}
    </div>
  );
}
