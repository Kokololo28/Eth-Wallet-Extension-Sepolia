import React, { useState, useEffect } from 'react';
import { getBalance, sendTransaction } from '../services/web3';
import { loadCurrentWallet, loadWallet, getCurrentWalletId } from '../services/storage';
import QRCode from 'react-qr-code';
import TokensTab from './TokensTab';
import TransactionsTab from './TransactionsTab';
import WalletsTab from './WalletsTab';
import ContractInteractionTab from './ContractInteractionTab';
import TokenCreatorTab from './TokenCreatorTab';

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

  useEffect(() => {
    loadWalletData();
  }, [password]);

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

  const handleSwitchWallet = async (walletId) => {
    setIsLoading(true);
    try {
      const data = loadWallet(walletId, password);
      if (data) {
        setWallet(data);
        const ethBalance = await getBalance(data.address);
        setBalance(ethBalance);
        setActiveTab('wallet'); 
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
      await sendTransaction(wallet.privateKey, recipient, amount);
      setSuccess('Транзакція успішно відправлена!');
      setRecipient('');
      setAmount('');
      setShowSend(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!wallet) {
    return <div className="p-4">Помилка завантаження гаманця</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Мій гаманець</h2>
        <button
          className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
          onClick={onLogout}
        >
          Вийти
        </button>
      </div>

      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-500 text-white rounded">{success}</div>}

      {/* Навігація по вкладках */}
      <div className="flex flex-wrap border-b border-gray-700 mb-4 overflow-x-auto">
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'wallet' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('wallet')}
        >
          Гаманець
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'tokens' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Токени
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'transactions' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Транзакції
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'contracts' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('contracts')}
        >
          Контракти
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'create-token' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('create-token')}
        >
          Створити токен
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'wallets' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('wallets')}
        >
          Мої гаманці
        </button>
      </div>

      {/* Вміст вкладки "Гаманець" */}
      {activeTab === 'wallet' && (
        <div>
          <div className="mb-6 bg-gray-800 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Баланс</span>
              <button
                className="text-blue-400 hover:text-blue-300 text-sm"
                onClick={refreshBalance}
              >
                Оновити
              </button>
            </div>
            <div className="text-2xl font-bold mb-2">{balance} ETH</div>
          </div>

          <div className="mb-6 bg-gray-800 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Моя адреса</span>
              <div>
                <button
                  className="text-blue-400 hover:text-blue-300 text-sm mr-2"
                  onClick={toggleQRCode}
                >
                  {showQR ? 'Сховати QR' : 'Показати QR'}
                </button>
                <button
                  className="text-blue-400 hover:text-blue-300 text-sm"
                  onClick={() => copyToClipboard(wallet.address)}
                >
                  Копіювати
                </button>
              </div>
            </div>
            <div className="mb-3 break-all">{wallet.address}</div>
            
            {showQR && (
              <div className="flex justify-center">
                <QRCode value={wallet.address} size={128} bgColor="#1f2937" fgColor="#ffffff" />
              </div>
            )}
          </div>

          {!showSend ? (
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
              onClick={() => setShowSend(true)}
            >
              Відправити ETH
            </button>
          ) : (
            <div className="bg-gray-800 p-4 rounded mb-4">
              <h3 className="text-lg font-medium mb-3">Відправити ETH</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Адреса отримувача</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Кількість ETH</label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                  onClick={handleSendTransaction}
                  disabled={isLoading}
                >
                  {isLoading ? 'Обробка...' : 'Відправити'}
                </button>
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
                  onClick={() => setShowSend(false)}
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
            <div className="flex items-center mb-4">
              <button 
                className="text-blue-400 hover:text-blue-300 flex items-center"
                onClick={() => setActiveTab('wallet')}
              >
                ← <span className="ml-1">Назад</span>
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
          <div className="flex items-center mb-4">
            <button 
              className="text-blue-400 hover:text-blue-300 flex items-center"
              onClick={() => setActiveTab('wallet')}
            >
              ← <span className="ml-1">Назад</span>
            </button>
          </div>
          <TransactionsTab address={wallet.address} />
        </div>
      )}

      {/* Вкладка "Контракти" */}
      {activeTab === 'contracts' && (
        <div>
          <div className="flex items-center mb-4">
            <button 
              className="text-blue-400 hover:text-blue-300 flex items-center"
              onClick={() => setActiveTab('wallet')}
            >
              ← <span className="ml-1">Назад</span>
            </button>
          </div>
          <ContractInteractionTab wallet={wallet} />
        </div>
      )}

      {/* Вкладка "Створити токен" */}
      {activeTab === 'create-token' && (
        <div>
          <div className="flex items-center mb-4">
            <button 
              className="text-blue-400 hover:text-blue-300 flex items-center"
              onClick={() => setActiveTab('wallet')}
            >
              ← <span className="ml-1">Назад</span>
            </button>
          </div>
          <TokenCreatorTab wallet={wallet} />
        </div>
      )}

      {/* Вкладка "Мої гаманці" */}
      {activeTab === 'wallets' && (
        <div>
          <div className="flex items-center mb-4">
            <button 
              className="text-blue-400 hover:text-blue-300 flex items-center"
              onClick={() => setActiveTab('wallet')}
            >
              ← <span className="ml-1">Назад</span>
            </button>
          </div>
          <WalletsTab 
            onCreateNewWallet={onCreateNewWallet} 
            onSwitchWallet={handleSwitchWallet} 
          />
        </div>
      )}
    </div>
  );
};

export default WalletDashboard;