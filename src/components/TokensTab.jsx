import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getAllTokensForAddress, getTokenInfo, saveCustomToken } from '../services/web3';

const TokenDetail = ({ token, onBack }) => {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button 
          className="back-button"
          onClick={onBack}
        >
          ←
        </button>
        <h2 className="text-lg font-medium ml-2">Інформація про токен</h2>
      </div>
      
      <div className="address-card">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl font-medium">{token.symbol}</div>
          <div className="text-xl font-medium">{formatTokenBalance(token.balance)}</div>
        </div>
        
        <div className="mb-2">
          <span className="text-gray-400">Повна назва:</span> 
          <span className="ml-2">{token.name}</span>
        </div>
        
        <div className="mb-3">
          <span className="text-gray-400">Адреса контракту:</span> 
          <div className="mt-1 font-mono text-sm break-all address-text">{token.address}</div>
        </div>
        
        <div className="pt-3 border-t border-gray-700 text-center">
          <button
            className="btn-primary"
            onClick={() => navigator.clipboard.writeText(token.address)}
          >
            Копіювати адресу контракту
          </button>
        </div>
      </div>
      
      <div className="address-card mt-4">
        <h3 className="text-sm font-medium mb-2 text-gray-400">Транзакції з токеном</h3>
        <div className="empty-state py-4">
          <p>Історія транзакцій з цим токеном буде доступна пізніше</p>
        </div>
      </div>
    </div>
  );
};

// Функція для форматування балансу токену
const formatTokenBalance = (balance) => {
  if (!balance || balance === null || balance === undefined) {
    return '0.0000';
  }
  
  const numBalance = parseFloat(balance);
  
  if (isNaN(numBalance)) {
    console.error('Неправильний баланс токену:', balance);
    return '0.0000';
  }
  
  // Якщо баланс дуже маленький, показуємо більше знаків після коми
  if (numBalance > 0 && numBalance < 0.0001) {
    return numBalance.toExponential(2);
  }
  
  return numBalance.toFixed(4);
};

const TokensTab = ({ address, onTokenDetailView }) => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddToken, setShowAddToken] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    loadTokens();
  }, [address]);

  // Повідомляємо батьківський компонент про зміну стану детального перегляду
  useEffect(() => {
    if (onTokenDetailView) {
      onTokenDetailView(selectedToken !== null);
    }
  }, [selectedToken, onTokenDetailView]);

  const loadTokens = async () => {
    console.log('Завантаження токенів для адреси:', address);
    setIsLoading(true);
    setError('');
    
    try {
      const tokensData = await getAllTokensForAddress(address);
      console.log('Отримано токени:', tokensData);
      setTokens(tokensData);
      
      if (tokensData.length === 0) {
        console.log('Токенів не знайдено');
      }
    } catch (error) {
      console.error('Помилка завантаження токенів:', error);
      setError('Помилка завантаження токенів: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!ethers.utils.isAddress(newTokenAddress)) {
      setError('Невірна адреса токена');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Додавання токену:', newTokenAddress);
      const tokenInfo = await getTokenInfo(newTokenAddress);
      
      if (!tokenInfo) {
        setError('Не вдалося отримати інформацію про токен');
        setIsLoading(false);
        return;
      }
      
      console.log('Інформація про токен отримана:', tokenInfo);
      saveCustomToken(tokenInfo);
      setSuccess(`Токен ${tokenInfo.symbol} успішно додано!`);
      setNewTokenAddress('');
      setShowAddToken(false);
      
      // Оновлюємо список токенів
      setTimeout(() => {
        loadTokens();
      }, 1000);
    } catch (error) {
      console.error('Помилка додавання токена:', error);
      setError('Помилка додавання токена: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenClick = (token) => {
    console.log('Вибрано токен:', token);
    setSelectedToken(token);
  };

  const handleBackToList = () => {
    setSelectedToken(null);
  };

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Якщо вибрано токен, показуємо детальну інформацію
  if (selectedToken) {
    return <TokenDetail token={selectedToken} onBack={handleBackToList} />;
  }

  return (
    <div className="p-4">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Токени</h2>
        <button
          className="btn-small"
          onClick={() => setShowAddToken(!showAddToken)}
        >
          {showAddToken ? 'Скасувати' : 'Додати токен'}
        </button>
      </div>

      {showAddToken && (
        <div className="address-card mb-4">
          <div className="mb-2">
            <label className="input-label">Адреса токену</label>
            <input
              type="text"
              className="input-field2"
              value={newTokenAddress}
              onChange={(e) => setNewTokenAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button
            className="btn-primary"
            onClick={handleAddToken}
            disabled={isLoading}
          >
            {isLoading ? 'Додавання...' : 'Додати'}
          </button>
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="empty-state">
          <p>У вас ще немає токенів</p>
          <p className="text-sm mt-2">Додайте адресу контракту вашого токену вище</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div 
              key={token.address} 
              className="token-item"
              onClick={() => handleTokenClick(token)}
            >
              <div className="token-info">
                <div className="token-icon">{token.symbol[0]}</div>
                <div className="token-name">{token.symbol}</div>
              </div>
              <div className="token-balance">{formatTokenBalance(token.balance)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokensTab;