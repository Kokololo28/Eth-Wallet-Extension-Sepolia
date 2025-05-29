import React, { useState } from 'react';
import { loadCurrentWallet, getWalletsList, getCurrentWalletId } from '../services/storage';

const WalletLogin = ({ onLogin, onCreateNew }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Вхід до гаманця</h2>
      
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Пароль</label>
        <input
          type="password"
          className="w-full bg-gray-700 border border-gray-600 rounded p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введіть пароль"
        />
      </div>
      
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
        onClick={handleLogin}
      >
        Увійти
      </button>
      
      <button
        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        onClick={onCreateNew}
      >
        Створити новий гаманець
      </button>
    </div>
  );
};

export default WalletLogin;