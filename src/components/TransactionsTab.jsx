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
        <span className="px-2 py-1 bg-yellow-500 text-yellow-900 rounded text-xs">
          В обробці
        </span>
      );
    } else if (status === 'success') {
      return (
        <span className="px-2 py-1 bg-green-500 text-green-900 rounded text-xs">
          Успішно
        </span>
      );
    } else {
      return (
        <div>
          <span className="px-2 py-1 bg-red-500 text-red-900 rounded text-xs">
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
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Історія транзакцій</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          У вас ще немає транзакцій
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.hash} className="p-3 bg-gray-800 rounded border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{parseFloat(tx.value).toFixed(6)} ETH</div>
                  <div className="text-sm text-gray-400">
                    {address.toLowerCase() === tx.from.toLowerCase() ? 'Відправлено на ' : 'Отримано від '}
                    {truncateAddress(address.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from)}
                  </div>
                </div>
                <div>
                  {getStatusBadge(tx.status, tx.errorMessage)}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <div>{formatDate(tx.timestamp)}</div>
                <div className="truncate" style={{ maxWidth: '120px' }}>
                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;