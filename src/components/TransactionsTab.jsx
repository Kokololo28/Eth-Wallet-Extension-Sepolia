import React, { useState, useEffect } from 'react';
import { getTransactionHistory, openTransactionInExplorer, isValidTxHash } from '../services/web3';

const TransactionsTab = ({ address }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
    
    // Оновлюємо транзакції кожні 10 секунд для відстеження змін статусу
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, [address]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const txs = await getTransactionHistory(address);
      setTransactions(txs);
    } catch (error) {
      console.error('Помилка завантаження історії транзакцій:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return hash.slice(0, 8) + '...' + hash.slice(-6);
  };

  // Функція для відкриття транзакції в Block Explorer використовує сервіс
  const handleOpenInExplorer = (txHash) => {
    if (isValidTxHash(txHash)) {
      openTransactionInExplorer(txHash);
    } else {
      console.error('Невалідний хеш транзакції:', txHash);
    }
  };

  const getStatusBadge = (status, errorMessage) => {
    if (status === 'pending') {
      return (
        <span className="transaction-status status-pending">
          В обробці
        </span>
      );
    } else if (status === 'success') {
      return (
        <span className="transaction-status status-success">
          Успішно
        </span>
      );
    } else {
      return (
        <div>
          <span className="transaction-status status-failed">
            Не вдалося
          </span>
          {errorMessage && (
            <div className="text-xs text-red-400 mt-1">{errorMessage}</div>
          )}
        </div>
      );
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Історія транзакцій</h2>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>У вас ще немає транзакцій</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.hash} className="transaction-item">
              <div className="transaction-header">
                <div>
                  <div className="transaction-amount">{parseFloat(tx.value).toFixed(6)} {tx.tokenSymbol || 'ETH'}</div>
                  <div className="transaction-details">
                    {address.toLowerCase() === tx.from.toLowerCase() ? 'Відправлено на ' : 'Отримано від '}
                    {truncateAddress(address.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from)}
                  </div>
                </div>
                <div>
                  {getStatusBadge(tx.status, tx.errorMessage)}
                </div>
              </div>
              
              <div className="transaction-details mb-3">
                {formatDate(tx.timestamp)}<br/>
                <span className="font-mono">{truncateHash(tx.hash)}</span>
              </div>

              {/* Кнопка Block Explorer */}
              {tx.hash && isValidTxHash(tx.hash) && (
                <div className="transaction-actions">
                  <button
                    className="block-explorer-btn"
                    onClick={() => handleOpenInExplorer(tx.hash)}
                    title="Переглянути в Sepolia Etherscan"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className="block-explorer-icon"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15,3 21,3 21,9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View on Block Explorer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;