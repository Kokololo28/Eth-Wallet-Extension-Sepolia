import React, { useState } from 'react';
import { createWallet, importWalletFromMnemonic, importWalletFromPrivateKey } from '../services/web3';
import { saveWallet } from '../services/storage';

const WalletCreate = ({ onWalletCreated, password, isNewPassword = true }) => {
  const [tab, setTab] = useState('create');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [walletName, setWalletName] = useState('');
  const [error, setError] = useState('');
  const [newWallet, setNewWallet] = useState(null);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [success, setSuccess] = useState('');

  const handleCreateWallet = () => {
    // Якщо це новий пароль, перевіряємо його
    if (isNewPassword) {
      if (newPassword !== confirmPassword) {
        setError('Паролі не співпадають');
        return;
      }

      if (newPassword.length < 8) {
        setError('Пароль має бути не менше 8 символів');
        return;
      }
    }

    if (!walletName) {
      setError('Введіть назву гаманця');
      return;
    }

    try {
      const wallet = createWallet();
      // Додаємо назву гаманця
      wallet.name = walletName;
      setNewWallet(wallet);
      setError('');
    } catch (error) {
      setError('Помилка створення гаманця: ' + error.message);
    }
  };

  const handleCopyPhrase = () => {
    if (newWallet?.mnemonic) {
      navigator.clipboard.writeText(newWallet.mnemonic);
      setSuccess('Seed фразу скопійовано до буфера обміну!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleConfirmSaved = () => {
    setPhraseConfirmed(true);
  };

  const handleFinishCreation = () => {
    try {
      const actualPassword = isNewPassword ? newPassword : password;
      saveWallet(newWallet, actualPassword);
      // Передаємо пароль назад до батьківського компонента
      onWalletCreated(isNewPassword ? newPassword : password);
    } catch (error) {
      setError('Помилка збереження гаманця: ' + error.message);
    }
  };

  const handleImportWallet = () => {
    // Перевірка пароля для нових користувачів
    if (isNewPassword) {
      if (newPassword !== confirmPassword) {
        setError('Паролі не співпадають');
        return;
      }

      if (newPassword.length < 8) {
        setError('Пароль має бути не менше 8 символів');
        return;
      }
    }

    if (!walletName) {
      setError('Введіть назву гаманця');
      return;
    }

    try {
      let wallet;
      if (tab === 'privateKey') {
        wallet = importWalletFromPrivateKey(privateKey);
      } else if (tab === 'mnemonic') {
        wallet = importWalletFromMnemonic(mnemonic);
      }

      // Додаємо назву гаманця
      wallet.name = walletName;
      
      const actualPassword = isNewPassword ? newPassword : password;
      saveWallet(wallet, actualPassword);
      // Передаємо пароль назад до батьківського компонента
      onWalletCreated(isNewPassword ? newPassword : password);
    } catch (error) {
      setError('Помилка імпорту гаманця: ' + error.message);
    }
  };

  // Показ seed фрази після створення гаманця
  if (newWallet && !phraseConfirmed) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Збережіть вашу seed фразу</h2>
        
        <div className="mb-4 p-2 bg-yellow-600 text-white rounded text-sm">
          Важливо! Запишіть цю фразу в надійному місці. Це єдиний спосіб відновити доступ до вашого гаманця.
        </div>

        {success && <div className="mb-4 p-2 bg-green-500 text-white rounded">{success}</div>}
        
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <p className="break-words font-mono text-amber-400">
            {newWallet.mnemonic}
          </p>
        </div>
        
        <button
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={handleCopyPhrase}
        >
          Копіювати seed фразу
        </button>
        
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          onClick={handleConfirmSaved}
        >
          Я зберіг seed фразу в надійному місці
        </button>
      </div>
    );
  }

  // Підтвердження перед фінальним збереженням
  if (newWallet && phraseConfirmed) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Підтвердження</h2>
        
        <div className="mb-4 p-2 bg-gray-700 rounded">
          <p className="mb-2"><span className="text-gray-400">Назва:</span> {newWallet.name}</p>
          <p className="mb-2"><span className="text-gray-400">Адреса:</span></p>
          <p className="font-mono break-all">{newWallet.address}</p>
        </div>
        
        <div className="mb-6 p-2 bg-green-800 text-white rounded">
          Ваш гаманець готовий до використання! Переконайтеся, що ви зберегли seed фразу.
        </div>
        
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={handleFinishCreation}
        >
          Завершити налаштування
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex rounded-md overflow-hidden border border-gray-600">
        <button
          className={`flex-1 py-2 px-4 ${tab === 'create' ? 'bg-blue-600' : 'bg-gray-800'}`}
          onClick={() => setTab('create')}
        >
          Створити
        </button>
        <button
          className={`flex-1 py-2 px-4 ${tab === 'privateKey' ? 'bg-blue-600' : 'bg-gray-800'}`}
          onClick={() => setTab('privateKey')}
        >
          Приватний ключ
        </button>
        <button
          className={`flex-1 py-2 px-4 ${tab === 'mnemonic' ? 'bg-blue-600' : 'bg-gray-800'}`}
          onClick={() => setTab('mnemonic')}
        >
          Фраза
        </button>
      </div>

      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Назва гаманця</label>
        <input
          type="text"
          className="w-full bg-gray-700 border border-gray-600 rounded p-2"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="Введіть назву гаманця"
        />
      </div>

      {isNewPassword && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введіть пароль"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Підтвердження паролю</label>
            <input
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Підтвердіть пароль"
            />
          </div>
        </>
      )}

      {tab === 'privateKey' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Приватний ключ</label>
          <input
            type="text"
            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Введіть приватний ключ"
          />
        </div>
      )}

      {tab === 'mnemonic' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Мнемонічна фраза</label>
          <textarea
            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="Введіть мнемонічну фразу з 12 слів"
            rows={3}
          />
        </div>
      )}

      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        onClick={tab === 'create' ? handleCreateWallet : handleImportWallet}
      >
        {tab === 'create' ? 'Створити гаманець' : 'Імпортувати гаманець'}
      </button>
    </div>
  );
};

export default WalletCreate;