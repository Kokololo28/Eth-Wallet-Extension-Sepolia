import React, { useState } from 'react';
import AnimatedLogo from './AnimatedLogo';
import { loadCurrentWallet, getWalletsList } from '../services/storage';

const WalletLogin = ({ onLogin, onCreateNew }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const walletsList = getWalletsList();

  const handleLogin = () => {
    if (!password) {
      setError('Введіть пароль');
      return;
    }

    const wallet = loadCurrentWallet(password);
    if (wallet) {
      onLogin(password);
    } else {
      setError('Неправильний пароль');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="logo-section">
        <AnimatedLogo />
        <div className="text-center">
          <p className="text-gray-400 text-base mb-2">Ласкаво просимо!</p>
          <p className="text-gray-500 text-sm">
            {walletsList.length} {walletsList.length === 1 ? 'гаманець' : 'гаманців'} збережено
          </p>
        </div>
      </div>
      
      <div>
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="input-group">
          <label className="input-label">Пароль</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введіть пароль"
            autoFocus
          />
        </div>
        
        <button
          className="btn-primary"
          onClick={handleLogin}
        >
          Увійти
        </button>
        
        <button
          className="btn-secondary"
          onClick={onCreateNew}
        >
          Створити новий гаманець
        </button>
      </div>
    </div>
  );
};

export default WalletLogin;