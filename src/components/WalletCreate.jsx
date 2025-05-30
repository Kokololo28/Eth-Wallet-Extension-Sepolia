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
        
        <div className="warning-box">
          <p className="warning-text">
            Важливо! Запишіть цю фразу в надійному місці. Це єдиний спосіб відновити доступ до вашого гаманця.
          </p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        
        <div className="seed-phrase-box">
          <p className="seed-phrase">
            {newWallet.mnemonic}
          </p>
        </div>
        
        <button
          className="btn-primary"
          onClick={handleCopyPhrase}
        >
          Копіювати seed фразу
        </button>
        
        <button
          className="btn-primary"
          style={{ background: '#22c55e' }}
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
        
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <p className="mb-2"><span className="text-gray-400">Назва:</span> {newWallet.name}</p>
          <p className="mb-2"><span className="text-gray-400">Адреса:</span></p>
          <p className="font-mono text-sm break-all">{newWallet.address}</p>
        </div>
        
        <div className="alert alert-success mb-4">
          Ваш гаманець готовий до використання! Переконайтеся, що ви зберегли seed фразу.
        </div>
        
        <button
          className="btn-primary"
          onClick={handleFinishCreation}
        >
          Завершити налаштування
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="create-tabs">
        <button
          className={`create-tab ${tab === 'create' ? 'active' : ''}`}
          onClick={() => setTab('create')}
        >
          Створити
        </button>
        <button
          className={`create-tab ${tab === 'privateKey' ? 'active' : ''}`}
          onClick={() => setTab('privateKey')}
        >
          Приватний ключ
        </button>
        <button
          className={`create-tab ${tab === 'mnemonic' ? 'active' : ''}`}
          onClick={() => setTab('mnemonic')}
        >
          Фраза
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="input-group">
        <label className="input-label">Назва гаманця</label>
        <input
          type="text"
          className="input-field"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          placeholder="Введіть назву гаманця"
        />
      </div>

      {isNewPassword && (
        <>
          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введіть пароль"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Підтвердження паролю</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Підтвердіть пароль"
            />
          </div>
        </>
      )}

      {tab === 'privateKey' && (
        <div className="input-group">
          <label className="input-label">Приватний ключ</label>
          <input
            type="text"
            className="input-field"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Введіть приватний ключ"
          />
        </div>
      )}

      {tab === 'mnemonic' && (
        <div className="input-group">
          <label className="input-label">Мнемонічна фраза</label>
          <textarea
            className="input-field"
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder="Введіть мнемонічну фразу з 12 слів"
            rows={3}
          />
        </div>
      )}

      <button
        className="btn-primary"
        onClick={tab === 'create' ? handleCreateWallet : handleImportWallet}
      >
        {tab === 'create' ? 'Створити гаманець' : 'Імпортувати гаманець'}
      </button>
    </div>
  );
};

export default WalletCreate;