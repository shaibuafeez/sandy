import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import usePointsStore from './store/pointsStore'
import PropTypes from 'prop-types'
import { createPortal } from 'react-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

const styles = {
  fixedLayer: `
    .fixed-layer {
      position: relative;
      z-index: 9999;
      transform: translate3d(0, 0, 0);
      will-change: transform;
      pointer-events: none;
    }
    .fixed-layer > * {
      pointer-events: auto;
    }
  `
};

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles.fixedLayer;
  document.head.appendChild(styleSheet);
}

// Create portal container
if (typeof document !== 'undefined') {
  const portalContainer = document.createElement('div');
  portalContainer.id = 'status-text-portal';
  portalContainer.style.cssText = `
    position: relative;
    z-index: 9999;
    pointer-events: none;
  `;
  document.body.appendChild(portalContainer);
}

const EffectsPortal = ({ children }) => {
  return createPortal(
    <div className="fixed inset-0 z-0">
      {children}
    </div>,
    document.body
  );
};

EffectsPortal.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  const points = usePointsStore(state => state.points)
  const [activeBooster, setActiveBooster] = useState(false);
  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [boostsRemaining, setBoostsRemaining] = useState(3);
  const [showTasks, setShowTasks] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [activeSection, setActiveSection] = useState('earn');
  const [energy, setEnergy] = useState(5000);
  const [lastClickTime, setLastClickTime] = useState(null);
  const [boostMultiplier, setBoostMultiplier] = useState(1);

  // Reset boosts daily
  useEffect(() => {
    const resetTime = localStorage.getItem('boostResetTime');
    const now = new Date();
    if (!resetTime || new Date(resetTime) < now.setHours(0,0,0,0)) {
      setBoostsRemaining(3);
      localStorage.setItem('boostResetTime', now.toISOString());
    } else {
      const savedBoosts = localStorage.getItem('boostsRemaining');
      if (savedBoosts) setBoostsRemaining(parseInt(savedBoosts));
    }
  }, []);

  // Save boosts remaining
  useEffect(() => {
    localStorage.setItem('boostsRemaining', boostsRemaining);
  }, [boostsRemaining]);

  // Show activation animation
  const showBoostActivationToast = () => {
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 20 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🚀</div>
          <div>
            <div className="font-bold">Booster Activated!</div>
            <div className="text-sm opacity-90">10x points for 30 seconds</div>
          </div>
        </div>
      </motion.div>
    ), { duration: 2000 });
  };

  // Show boost end toast
  const showBoostEndToast = () => {
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: 20 }}
        className="bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">⏰</div>
          <div>
            <div className="font-bold">Boost Ended</div>
            <div className="text-sm opacity-90">Back to normal speed</div>
          </div>
        </div>
      </motion.div>
    ), { duration: 2000 });
  };

  const activateBooster = () => {
    if (boostsRemaining > 0) {
      setBoostsRemaining(prev => prev - 1);
      setBoostMultiplier(10);
      setActiveBooster(true);
      setShowBoosterModal(false);
      
      showBoostActivationToast();

      // Reset after 30 seconds
      setTimeout(() => {
        setBoostMultiplier(1);
        setActiveBooster(false);
        showBoostEndToast();
      }, 30000);
    }
  };

  // Energy regeneration
  useEffect(() => {
    const energyTimer = setInterval(() => {
      setEnergy(current => {
        const now = Date.now();
        // If not clicked in last 0.5 seconds, regenerate energy
        if (!lastClickTime || now - lastClickTime > 500) {
          return Math.min(5000, current + 1);
        }
        return current;
      });
    }, 500); // Update every 0.5 seconds

    return () => clearInterval(energyTimer);
  }, [lastClickTime]);

  const handleEnergyUse = () => {
    if (energy <= 0) return false;
    setLastClickTime(Date.now());
    setEnergy(current => Math.max(0, current - 1));
    return true;
  };

  const getRank = (points) => {
    if (points >= 5000) return 'Ocean Master'
    if (points >= 2500) return 'Beach Explorer'
    return 'Sandy Starter'
  }

  // Tasks handler
  const handleTasks = () => {
    setShowTasks(prev => !prev);
    // Show tasks modal or panel
    toast.success('Daily Tasks Loading...', {
      icon: '📋',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  // Wallet handler
  const handleWallet = () => {
    setWalletConnected(prev => !prev);
    // Connect to SUI wallet
    toast.success(walletConnected ? 'Wallet Disconnected' : 'Connecting to SUI Wallet...', {
      icon: '👛',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  // Wallet Modal Component
  const WalletModal = () => {
    const [walletAddress, setWalletAddress] = useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      if (walletAddress.trim()) {
        setWalletConnected(true);
        setShowWalletModal(false);
        toast.success('Wallet connected successfully!');
      }
    };

    return createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Connect SUI Wallet</h2>
            <p className="text-gray-500">Enter your SUI wallet address to start earning points</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                placeholder="Enter your SUI wallet address"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium 
                       hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50"
              disabled={!walletAddress.trim()}
            >
              Connect Wallet
            </button>
          </form>

          <button
            onClick={() => setShowWalletModal(false)}
            className="mt-4 w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-xl font-medium 
                     hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              By connecting your wallet, you agree to our{' '}
              <a href="#" className="text-blue-500 hover:underline">Terms of Service</a>
            </p>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  // Booster Modal Component
  const BoosterModal = () => {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Speed Boosters</h2>
            <p className="text-gray-500">Multiply your points by 10x for 30 seconds!</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Boosts Remaining</span>
              <span className="font-bold text-purple-600">{boostsRemaining}/3</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${(boostsRemaining / 3) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Resets daily at midnight</p>
          </div>

          <button
            onClick={activateBooster}
            disabled={boostsRemaining === 0}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium 
                     hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 
                     disabled:cursor-not-allowed mb-4"
          >
            {boostsRemaining > 0 ? 'Activate Booster' : 'No Boosts Remaining'}
          </button>

          <button
            onClick={() => setShowBoosterModal(false)}
            className="w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-xl font-medium 
                     hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
        </motion.div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-screen-xl mx-auto h-full">
          <div className="absolute top-[5%] left-[10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
          <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[20%] left-[15%] w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-screen-xl mx-auto min-h-screen flex flex-col">
        {/* Header Area */}
        <header className="w-full py-6 px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              SANDY
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Points: {points}</p>
                <p className="text-xs text-gray-500">{getRank(points)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {points >= 5000 ? '🌊' : points >= 2500 ? '🏖️' : '🐚'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Top Navigation */}
        <nav className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-1 py-1.5 z-50">
          <div className="w-full max-w-screen-xl mx-auto">
            <div className="flex justify-between items-center gap-0.5">
              {['earn', 'ranks', 'rewards', 'leaderboard', 'about'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-2 py-1 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${activeSection === section
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Game Area */}
        <main className="flex-1 w-full flex flex-col items-center justify-center px-4 pb-24">
          {/* Game Circle */}
          <motion.div 
            className="relative w-full max-w-xs aspect-square"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {activeSection === 'earn' && (
              <EarnCircle 
                onEarnPoints={(points) => usePointsStore.getState().addPoints(points)} 
                onUseEnergy={handleEnergyUse}
                energy={energy}
                boostMultiplier={boostMultiplier}
              />
            )}
            {activeSection === 'ranks' && (
              <div className="text-center text-gray-600">
                <h3 className="text-xl font-semibold mb-2">Ranks Coming Soon</h3>
                <p className="text-sm">Exciting ranking system in development!</p>
              </div>
            )}
            {activeSection === 'rewards' && (
              <div className="text-center text-gray-600">
                <h3 className="text-xl font-semibold mb-2">Rewards Coming Soon</h3>
                <p className="text-sm">Amazing rewards are on the way!</p>
              </div>
            )}
            {activeSection === 'leaderboard' && (
              <div className="text-center text-gray-600">
                <h3 className="text-xl font-semibold mb-2">Leaderboard Coming Soon</h3>
                <p className="text-sm">Compete with other players soon!</p>
              </div>
            )}
            {activeSection === 'about' && (
              <div className="text-center text-gray-600">
                <h3 className="text-xl font-semibold mb-2">About SANDY</h3>
                <p className="text-sm">A community-driven memecoin built on SUI Network</p>
              </div>
            )}
          </motion.div>
        </main>

        {/* Energy Bar - Fixed above bottom navigation */}
        <div className="fixed bottom-32 left-0 right-0 px-4 z-40">
          <div className="max-w-screen-xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-600">Energy</span>
                <span className="text-xs font-medium text-blue-600">{Math.round(energy)}/5000</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${(energy / 5000) * 100}%` }}
                  animate={{
                    opacity: energy < 500 ? [0.5, 1] : 1
                  }}
                  transition={{
                    opacity: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
                  }}
                />
              </div>
              {energy < 500 && (
                <p className="text-[10px] text-red-500 mt-1">Energy low! Wait to regenerate...</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Bar - Fixed at Bottom */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-2 z-50">
          <div className="w-full max-w-screen-xl mx-auto">
            <div className="flex justify-between items-center">
              {/* Boosters Button */}
              <button
                onClick={() => setShowBoosterModal(true)}
                className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl 
                  ${activeBooster 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } transition-all duration-300`}
              >
                <div className="text-2xl mb-1">🚀</div>
                <span className="text-xs font-medium">Boosters</span>
                {boostsRemaining > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {boostsRemaining}
                  </div>
                )}
                {activeBooster && (
                  <motion.div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </button>

              {/* Tasks Button */}
              <motion.button
                onClick={handleTasks}
                className="relative group flex flex-col items-center py-2 px-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/90 to-purple-600 
                              flex items-center justify-center shadow-lg ${showTasks ? 'ring-2 ring-violet-400' : ''}`}>
                  <motion.div
                    animate={showTasks ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </motion.div>
                </div>
                <span className="mt-1 text-xs font-medium text-gray-700">Tasks</span>
                {showTasks && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">3</span>
                  </span>
                )}
              </motion.button>

              {/* SUI Wallet Button */}
              <motion.button
                onClick={() => setShowWalletModal(true)}
                className="relative group flex flex-col items-center py-2 px-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/90 to-blue-600 
                              flex items-center justify-center shadow-lg ${walletConnected ? 'ring-2 ring-cyan-400' : ''}`}>
                  <motion.div
                    animate={walletConnected ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0],
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className={`absolute -top-1 -right-1 w-2 h-2 ${walletConnected ? 'bg-green-400' : 'bg-gray-400'} 
                                   rounded-full border-2 border-blue-600`} />
                    </div>
                  </motion.div>
                </div>
                <span className="mt-1 text-xs font-medium text-gray-700">Wallet</span>
              </motion.button>
            </div>
          </div>
        </nav>

        {/* Toast Container */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
            },
          }}
        />

        {/* Render Modals */}
        <AnimatePresence>
          {showBoosterModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Speed Boosters</h2>
                  <p className="text-gray-500">Multiply your points by 10x for 30 seconds!</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Boosts Remaining</span>
                    <span className="font-bold text-purple-600">{boostsRemaining}/3</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${(boostsRemaining / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Resets daily at midnight</p>
                </div>

                <button
                  onClick={activateBooster}
                  disabled={boostsRemaining === 0}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium 
                           hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 
                           disabled:cursor-not-allowed mb-4"
                >
                  {boostsRemaining > 0 ? 'Activate Booster' : 'No Boosts Remaining'}
                </button>

                <button
                  onClick={() => setShowBoosterModal(false)}
                  className="w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-xl font-medium 
                           hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}

          {showWalletModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">👛</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Connect Wallet</h2>
                  <p className="text-gray-500">Connect your SUI wallet to save your progress</p>
                </div>

                <button
                  onClick={() => {
                    setWalletConnected(prev => !prev);
                    setShowWalletModal(false);
                    toast.success(walletConnected ? 'Wallet Disconnected' : 'Connected to SUI Wallet', {
                      icon: '👛',
                      style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                      },
                    });
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium 
                           hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 mb-4"
                >
                  {walletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
                </button>

                <button
                  onClick={() => setShowWalletModal(false)}
                  className="w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-xl font-medium 
                           hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const EarnCircle = ({ onEarnPoints, onUseEnergy, energy, boostMultiplier }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState(3);

  const handleClick = () => {
    if (isSpinning || energy < 1) return;
    
    // Only proceed if we successfully used energy
    if (!onUseEnergy()) return;

    setIsSpinning(true);
    const pointsToAdd = boostMultiplier;
    onEarnPoints(pointsToAdd);

    // Calculate new spin speed
    const newSpinSpeed = Math.max(0.5, spinSpeed - 0.2);
    setSpinSpeed(newSpinSpeed);

    // Show points earned with animation
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`px-4 py-2 rounded-xl font-bold shadow-lg
          ${boostMultiplier > 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white text-gray-800'}`}
      >
        +{pointsToAdd} points
      </motion.div>
    ), { duration: 1000 });

    setTimeout(() => {
      setIsSpinning(false);
    }, spinSpeed * 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Main Container */}
      <div className="relative w-64 h-64">
        {/* Beach Background Circle */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-sky-300 via-sky-200 to-amber-200 
                      overflow-hidden shadow-2xl transition-opacity duration-200
                      ${energy < 1 ? 'opacity-50' : 'opacity-100'}`}>
          {/* Waves Animation */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-400/30 to-transparent 
                        animate-wave overflow-hidden" />
        </div>

        {/* Button with Logo */}
        <motion.button
          onClick={handleClick}
          disabled={energy < 1}
          className={`relative w-full h-full rounded-full flex items-center justify-center text-white overflow-hidden
                     ${energy < 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          whileHover={energy >= 1 ? { scale: 1.05 } : {}}
          whileTap={energy >= 1 ? { scale: 0.95 } : {}}
          animate={isSpinning ? {
            rotate: 360,
            transition: {
              duration: spinSpeed,
              ease: "linear"
            }
          } : {}}
        >
          {/* Effects Container */}
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {isSpinning && (
                <div className="relative w-full h-full">
                  {/* Ripple Effect */}
                  <motion.div
                    className="absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/10"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1 }}
                  />
                  
                  {/* Particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-blue-300/20"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      initial={{ scale: 0 }}
                      animate={{
                        x: Math.cos(i * Math.PI / 3) * 50,
                        y: Math.sin(i * Math.PI / 3) * 50,
                        scale: [1, 0],
                        opacity: [0.2, 0],
                      }}
                      transition={{ duration: 0.8 }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Logo */}
          <div className="relative z-10 w-56 h-56">
            <img 
              src="/sandy-logo.png"
              alt="Sandy Logo"
              className="w-full h-full object-contain drop-shadow-lg filter brightness-110"
            />
          </div>
        </motion.button>

        {/* Points Display */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              className="absolute left-1/2 -top-12 z-20 text-3xl font-bold pointer-events-none"
              style={{
                transform: 'translateX(-50%)',
                background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              +{boostMultiplier}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

EarnCircle.propTypes = {
  onEarnPoints: PropTypes.func.isRequired,
  onUseEnergy: PropTypes.func.isRequired,
  energy: PropTypes.number.isRequired,
  boostMultiplier: PropTypes.number.isRequired,
};

export default App;