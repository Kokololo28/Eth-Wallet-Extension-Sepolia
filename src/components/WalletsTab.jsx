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
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
          onClick={onCreateNewWallet}
        >
          Створити новий
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          У вас ще немає гаманців
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className={`p-3 rounded border ${currentWalletId === wallet.id ? 'bg-blue-900 border-blue-600' : 'bg-gray-800 border-gray-700'}`}
            >
              {editingWalletId === wallet.id ? (
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded p-1 mr-2"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white p-1 rounded mr-1"
                    onClick={saveWalletName}
                  >
                    💾
                  </button>
                  <button
                    className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded"
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
                      className="text-gray-400 hover:text-white p-1"
                      onClick={() => handleRenameWallet(wallet.id)}
                      title="Перейменувати"
                    >
                      ✏️
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500 p-1"
                      onClick={() => promptDeleteWallet(wallet.id)}
                      title="Видалити"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                  onClick={() => handleSwitchWallet(wallet.id)}
                >
                  Перейти до гаманця
                </button>
              )}

              {confirmDelete === wallet.id && (
                <div className="mt-2 p-2 bg-red-900 rounded border border-red-700">
                  <p className="text-sm text-white mb-2">Ви впевнені, що хочете видалити цей гаманець?</p>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                      onClick={handleDeleteWallet}
                    >
                      Так, видалити
                    </button>
                    <button
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-sm"
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