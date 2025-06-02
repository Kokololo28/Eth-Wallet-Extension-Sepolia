import React, { useState, useEffect } from 'react';
import WalletCreate from './components/WalletCreate';
import WalletDashboard from './components/WalletDashboard';
import WalletLogin from './components/WalletLogin';
import { isPasswordSet, getWalletsList } from './services/storage';

function App() {
  const [page, setPage] = useState('loading');
  const [password, setPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи є створений гаманець
    if (isPasswordSet()) {
      setPage('login');
    } else {
      setPage('create');
    }
  }, []);

  const handleWalletCreated = (newPassword = null) => {
    if (newPassword) {
      setPassword(newPassword);
    }
    setPage('dashboard');
    setPasswordVerified(true);
  };

  const handleLogin = (pwd) => {
    setPassword(pwd);
    setPasswordVerified(true);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setPassword('');
    setPasswordVerified(false);
    setPage('login');
  };

  const handleCreateNewWallet = () => {
    setPage('addWallet');
  };

  // Функція для створення нового гаманця з екрану логіну
  const handleCreateNewFromLogin = () => {
    setPage('createNew');
  };

  const handleBackToDashboard = () => {
    setPage('dashboard');
  };

  const handleBackToLogin = () => {
    setPage('login');
  };

  // Визначаємо, чи показувати підзаголовок "тестова мережа"
  const showTestnetSubtitle = page !== 'login' || page === 'createNew';

  if (page === 'loading') {
    return (
      <div className="w-[360px] h-[600px] bg-slate-900 text-white flex justify-center items-center">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[360px] h-[600px] bg-slate-900 text-white flex flex-col">
      {/* Фіксований заголовок для екранів створення/логіну */}
      {(page === 'create' || page === 'login' || page === 'createNew') && (
        <div className="wallet-header">
          <h1>ZeroTrace</h1>
          {showTestnetSubtitle && <p>Тестова мережа</p>}
        </div>
      )}
      
      {/* Прокручуваний контент */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {page === 'create' && <WalletCreate onWalletCreated={handleWalletCreated} isNewPassword={true} />}
        
        {page === 'login' && <WalletLogin onLogin={handleLogin} onCreateNew={handleCreateNewFromLogin} />}
        
        {page === 'dashboard' && passwordVerified && <WalletDashboard password={password} onLogout={handleLogout} onCreateNewWallet={handleCreateNewWallet} />}
        
        {page === 'addWallet' && passwordVerified && (
          <div>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <button 
                className="back-button"
                onClick={handleBackToDashboard}
              >
                ←
              </button>
              <h2 className="text-lg font-bold">Новий гаманець</h2>
            </div>
            <WalletCreate 
              onWalletCreated={handleBackToDashboard} 
              password={password}
              isNewPassword={false} 
            />
          </div>
        )}

        {page === 'createNew' && (
          <div>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <button 
                className="back-button"
                onClick={handleBackToLogin}
              >
                ←
              </button>
              <h2 className="text-lg font-bold">Новий гаманець</h2>
            </div>
            <WalletCreate 
              onWalletCreated={handleWalletCreated} 
              isNewPassword={true} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;