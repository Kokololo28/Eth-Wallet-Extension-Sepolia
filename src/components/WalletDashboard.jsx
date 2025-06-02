import React, { useState, useEffect } from 'react';
import { getBalance, sendTransaction, getAllTokensForAddress, sendTokenTransaction } from '../services/web3';
import { loadCurrentWallet, loadWallet, getCurrentWalletId } from '../services/storage';
import QRCode from 'react-qr-code';
import TokensTab from './TokensTab';
import TransactionsTab from './TransactionsTab';
import WalletsTab from './WalletsTab';
import TokenCreatorTab from './TokenCreatorTab';
import { openAddressInExplorer } from '../services/web3';

const WalletDashboard = ({ password, onLogout, onCreateNewWallet }) => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [showQR, setShowQR] = useState(false); 
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('wallet'); 
  const [isTokenDetailView, setIsTokenDetailView] = useState(false);
  
  // Нові стани для токенів
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [showTokenSelect, setShowTokenSelect] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [password]);

  useEffect(() => {
    if (wallet && wallet.address) {
      loadTokens();
    }
  }, [wallet?.address]);

  // Закриття dropdown при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTokenSelect && !event.target.closest('.relative')) {
        setShowTokenSelect(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTokenSelect]);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      const data = loadCurrentWallet(password);
      if (data) {
        setWallet(data);
        const ethBalance = await getBalance(data.address);
        setBalance(ethBalance);
      }
    } catch (error) {
      console.error('Помилка завантаження гаманця:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokens = async () => {
    if (!wallet || !wallet.address) return;
  
    try {
      console.log('Завантажуємо токени для адреси:', wallet.address);
      const tokensData = await getAllTokensForAddress(wallet.address);
      console.log('Отримані токени:', tokensData);
      setTokens(tokensData);
    } catch (error) {
      console.error('Помилка завантаження токенів:', error);
    }
  };

  const handleSwitchWallet = async (walletId) => {
    setIsLoading(true);
    try {
      const data = loadWallet(walletId, password);
      if (data) {
        setWallet(data);
        const ethBalance = await getBalance(data.address);
        setBalance(ethBalance);
        setActiveTab('wallet');
        // Перезавантажуємо токени для нового гаманця
        await loadTokens();
      }
    } catch (error) {
      console.error('Помилка завантаження гаманця:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (wallet) {
      try {
        const ethBalance = await getBalance(wallet.address);
        setBalance(ethBalance);
        // Оновлюємо також баланси токенів
        await loadTokens();
      } catch (error) {
        console.error('Помилка оновлення балансу:', error);
      }
    }
  };

  const handleSendTransaction = async () => {
    if (!recipient || !amount) {
      setError('Заповніть усі поля');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (selectedToken === 'ETH') {
        // Відправляємо ETH
        await sendTransaction(wallet.privateKey, recipient, amount);
      } else {
        // Відправляємо токен
        const token = tokens.find(t => t.symbol === selectedToken);
        if (token) {
          await sendTokenTransaction(
            wallet.privateKey, 
            token.address, 
            recipient, 
            amount,
            token.decimals || 18,
            token.symbol
          );
        }
      }
      
      setSuccess(`${selectedToken} успішно відправлено!`);
      setRecipient('');
      setAmount('');
      setShowSend(false);
      setSelectedToken('ETH');
      setTimeout(refreshBalance, 2000);
    } catch (error) {
      setError('Помилка відправлення: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Скопійовано в буфер обміну');
    setTimeout(() => setSuccess(''), 2000);
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  const handleTokenSelect = (tokenSymbol) => {
    setSelectedToken(tokenSymbol);
    setShowTokenSelect(false);
  };

  const getSelectedTokenBalance = () => {
    if (selectedToken === 'ETH') {
      return balance;
    }
    const token = tokens.find(t => t.symbol === selectedToken);
    return token ? token.balance : '0';
  };

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!wallet) {
    return <div className="p-4">Помилка завантаження гаманця</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard header */}
      <div className="dashboard-header">
        <h2>Мій гаманець</h2>
        <button className="logout-btn" onClick={onLogout}>
          Вийти
        </button>
      </div>

      {/* Область для повідомлень */}
      {(error || success) && (
        <div className="p-4 flex-shrink-0">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>
      )}

      {/* Контент вкладок */}
      <div className="content-with-nav">
        {/* Вміст вкладки "Гаманець" */}
        {activeTab === 'wallet' && (
          <div>
            <div className="balance-card">
              <div className="balance-header">
                <span className="balance-label">Баланс</span>
                <button className="refresh-link" onClick={refreshBalance}>
                  Оновити
                </button>
              </div>
              <div className="balance-amount">{parseFloat(balance).toFixed(8)} ETH</div>
            </div>

            <div className="address-card">
              <div className="address-header">
                <span className="balance-label">Моя адреса</span>
                <div className="address-actions">
                  <button className="action-link" onClick={toggleQRCode}>
                    {showQR ? 'Сховати QR' : 'Показати QR'}
                  </button>
                  <button className="action-link" onClick={() => copyToClipboard(wallet.address)}>
                    Копіювати
                  </button>
                  <button
                    className="action-link"
                    onClick={() => openAddressInExplorer(wallet.address)}
                    title="Переглянути адресу в Block Explorer"
                  >
                    Explorer
                  </button>
                </div>
              </div>
              <div className="address-text">{wallet.address}</div>
              
              {showQR && (
                <div className="qr-container">
                  <QRCode value={wallet.address} size={128} />
                </div>
              )}
            </div>

            {!showSend ? (
              <div className="address-card2">
                <button className="btn-primary" onClick={() => {
                  setShowSend(true);
                  loadTokens(); // Перезавантажуємо токени при відкритті
                }}>
                  <span style={{ marginRight: '8px' }}>↑</span>
                    Відправити
                  </button>
              </div>
            ) : (
              <div className="address-card">
                <h3 className="text-lg font-medium mb-3">Відправити</h3>
                
                {/* Вибір токена */}
                <div className="input-group">
                  <label className="input-label">Виберіть токен</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="input-field text-left flex justify-between items-center"
                      onClick={() => setShowTokenSelect(!showTokenSelect)}
                    >
                      <span>{selectedToken}</span>
                      <span className="text-gray-400">▼</span>
                    </button>
                    
                    {showTokenSelect && (
                      <div className="token-select-dropdown">
                        <button
                          className="token-select-item"
                          onClick={() => handleTokenSelect('ETH')}
                        >
                          <span>ETH</span>
                          <span>{parseFloat(balance).toFixed(4)}</span>
                        </button>
                        {tokens.map((token) => (
                          <button
                            key={token.address}
                            className="token-select-item"
                            onClick={() => handleTokenSelect(token.symbol)}
                          >
                            <span>{token.symbol}</span>
                            <span>{parseFloat(token.balance).toFixed(4)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Доступно: {getSelectedTokenBalance()} {selectedToken}
                  </p>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Адреса отримувача</label>
                  <input
                    type="text"
                    className="input-field"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Кількість {selectedToken}</label>
                  <div className="number-input-wrapper">
                    <input
                      type="number"
                      step="0.0001"
                      className="input-field"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.01"
                    />
                    <div className="number-arrows">
                      <button
                        type="button"
                        className="number-arrow"
                        onClick={() => {
                          const currentAmount = parseFloat(amount) || 0;
                          setAmount((currentAmount + 0.0001).toFixed(4));
                        }}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M7 14l5-5 5 5z"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="number-arrow"
                        onClick={() => {
                          const currentAmount = parseFloat(amount) || 0;
                          if (currentAmount > 0.0001) {
                            setAmount((currentAmount - 0.0001).toFixed(4));
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className="btn-primary flex-1"
                    onClick={handleSendTransaction}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Обробка...' : 'Відправити'}
                  </button>
                  <button
                    className="btn-secondary flex-1"
                    onClick={() => {
                      setShowSend(false);
                      setSelectedToken('ETH');
                      setRecipient('');
                      setAmount('');
                    }}
                    disabled={isLoading}
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Вкладка "Токени" */}
        {activeTab === 'tokens' && (
          <div>
            {!isTokenDetailView && (
              <div className="flex items-center p-4 border-b border-gray-700">
                <button 
                  className="back-button"
                  onClick={() => setActiveTab('wallet')}
                >
                  ←
                </button>
              </div>
            )}
            <TokensTab 
              address={wallet.address} 
              onTokenDetailView={setIsTokenDetailView} 
            />
          </div>
        )}

        {/* Вкладка "Транзакції" */}
        {activeTab === 'transactions' && (
          <div>
            <div className="flex items-center p-4 border-b border-gray-700">
              <button 
                className="back-button"
                onClick={() => setActiveTab('wallet')}
              >
                ←
              </button>
            </div>
            <TransactionsTab address={wallet.address} />
          </div>
        )}

        {/* Вкладка "Створити токен" */}
        {activeTab === 'create-token' && (
          <div>
            <div className="flex items-center p-4 border-b border-gray-700">
              <button 
                className="back-button"
                onClick={() => setActiveTab('wallet')}
              >
                ←
              </button>
            </div>
            <TokenCreatorTab wallet={wallet} />
          </div>
        )}

        {/* Вкладка "Мої гаманці" */}
        {activeTab === 'wallets' && (
          <div>
            <div className="flex items-center p-4 border-b border-gray-700">
              <button 
                className="back-button"
                onClick={() => setActiveTab('wallet')}
              >
                ←
              </button>
            </div>
            <WalletsTab 
              onCreateNewWallet={onCreateNewWallet} 
              onSwitchWallet={handleSwitchWallet} 
            />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          <span>Гаманець</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <span>Токени</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l3.59-3.58L17 12l-5 5z"/>
          </svg>
          <span>Транзакції</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'create-token' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-token')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 2l-5.5 9h11z M12 22l5.5-9h-11z M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
          </svg>
          <span>Створити</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'wallets' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallets')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <span>Гаманці</span>
        </button>
      </nav>
    </div>
  );
};

export default WalletDashboard;