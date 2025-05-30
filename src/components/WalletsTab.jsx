import React, { useState, useEffect } from 'react';
import { getWalletsList, setCurrentWallet, getCurrentWalletId, renameWallet, deleteWallet } from '../services/storage';

const WalletsTab = ({ onCreateNewWallet, onSwitchWallet }) => {
  const [wallets, setWallets] = useState([]);
  const [currentWalletId, setCurrentWalletId] = useState('');
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = () => {
    const walletsList = getWalletsList();
    setWallets(walletsList);
    setCurrentWalletId(getCurrentWalletId());
  };

  const handleSwitchWallet = (walletId) => {
    setCurrentWallet(walletId);
    setCurrentWalletId(walletId);
    onSwitchWallet(walletId);
  };

  const handleRenameWallet = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      setEditingWalletId(walletId);
      setNewWalletName(wallet.name);
    }
  };

  const saveWalletName = () => {
    if (newWalletName.trim()) {
      renameWallet(editingWalletId, newWalletName);
      setEditingWalletId(null);
      loadWallets();
    }
  };

  const promptDeleteWallet = (walletId) => {
    setConfirmDelete(walletId);
  };

  const handleDeleteWallet = () => {
    if (confirmDelete) {
      const updatedList = deleteWallet(confirmDelete);
      setWallets(updatedList);
      setConfirmDelete(null);
      
      // Якщо видалено поточний гаманець, оновимо поточний ID
      setCurrentWalletId(getCurrentWalletId());
    }
  };

  const cancelEdit = () => {
    setEditingWalletId(null);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return address.slice(0, 8) + '...' + address.slice(-6);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Мої гаманці</h2>
        <button
          className="btn-small"
          onClick={onCreateNewWallet}
        >
          Створити новий
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="empty-state">
          <p>У вас ще немає гаманців</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className={`wallet-list-item ${currentWalletId === wallet.id ? 'active' : ''}`}
            >
              {editingWalletId === wallet.id ? (
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    className="flex-1 input-field mr-2"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="btn-small mr-1"
                    style={{ padding: '8px 12px' }}
                    onClick={saveWalletName}
                  >
                    💾
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '8px 12px' }}
                    onClick={cancelEdit}
                  >
                    ✖️
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{wallet.name}</div>
                  <div className="flex space-x-1">
                    <button
                      className="action-link p-1"
                      onClick={() => handleRenameWallet(wallet.id)}
                      title="Перейменувати"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-link p-1"
                      onClick={() => promptDeleteWallet(wallet.id)}
                      title="Видалити"
                      style={{ color: '#ef4444' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400 mb-2">
                Адреса: {truncateAddress(wallet.address)}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Створено: {formatDate(wallet.dateCreated)}
              </div>

              {currentWalletId !== wallet.id && (
                <button
                  className="btn-primary"
                  onClick={() => handleSwitchWallet(wallet.id)}
                >
                  Перейти до гаманця
                </button>
              )}

              {confirmDelete === wallet.id && (
                <div className="mt-2 p-3 warning-box">
                  <p className="warning-text mb-2">Ви впевнені, що хочете видалити цей гаманець?</p>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 btn-primary"
                      style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }}
                      onClick={handleDeleteWallet}
                    >
                      Так, видалити
                    </button>
                    <button
                      className="flex-1 btn-secondary"
                      onClick={cancelDelete}
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletsTab;