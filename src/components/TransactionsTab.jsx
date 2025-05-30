import React, { useState, useEffect } from 'react';
import { getTransactionHistory } from '../services/web3';

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
                  <div className="transaction-amount">{parseFloat(tx.value).toFixed(6)} ETH</div>
                  <div className="transaction-details">
                    {address.toLowerCase() === tx.from.toLowerCase() ? 'Відправлено на ' : 'Отримано від '}
                    {truncateAddress(address.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from)}
                  </div>
                </div>
                <div>
                  {getStatusBadge(tx.status, tx.errorMessage)}
                </div>
              </div>
              <div className="transaction-details">
                {formatDate(tx.timestamp)}<br/>
                {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;