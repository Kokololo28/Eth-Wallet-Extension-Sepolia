import CryptoJS from 'crypto-js';

const WALLETS_LIST_KEY = 'ethereum_wallets_list';
const CURRENT_WALLET_KEY = 'ethereum_current_wallet';
const PASSWORD_KEY = 'wallet_password_set';

// Збереження нового гаманця з шифруванням
export const saveWallet = (walletData, password) => {
  // Шифруємо дані гаманця
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(walletData),
    password
  ).toString();
  
  // Генеруємо унікальний ID для гаманця, якщо його немає
  const walletId = walletData.id || `wallet_${Date.now()}`;
  const name = walletData.name || `Гаманець ${new Date().toLocaleDateString()}`;

  // Отримуємо поточний список гаманців
  const walletsList = getWalletsList() || [];
  
  // Створюємо запис про гаманець з метаданими
  const walletMeta = {
    id: walletId,
    address: walletData.address,
    name: name,
    dateCreated: Date.now()
  };
  
  // Додаємо або оновлюємо метадані гаманця в списку
  const existingIndex = walletsList.findIndex(w => w.id === walletId);
  if (existingIndex >= 0) {
    walletsList[existingIndex] = walletMeta;
  } else {
    walletsList.push(walletMeta);
  }
  
  // Зберігаємо список гаманців
  localStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(walletsList));
  
  // Зберігаємо зашифровані дані гаманця
  localStorage.setItem(`wallet_${walletId}`, encrypted);
  
  // Встановлюємо поточний гаманець
  setCurrentWallet(walletId);
  
  // Встановлюємо прапорець, що пароль створено
  localStorage.setItem(PASSWORD_KEY, 'true');
  
  return walletMeta;
};

// Отримання списку всіх гаманців
export const getWalletsList = () => {
  const list = localStorage.getItem(WALLETS_LIST_KEY);
  return list ? JSON.parse(list) : [];
};

// Встановлення поточного гаманця
export const setCurrentWallet = (walletId) => {
  localStorage.setItem(CURRENT_WALLET_KEY, walletId);
};

// Отримання ID поточного гаманця
export const getCurrentWalletId = () => {
  return localStorage.getItem(CURRENT_WALLET_KEY);
};

// Завантаження конкретного гаманця
export const loadWallet = (walletId, password) => {
  const encrypted = localStorage.getItem(`wallet_${walletId}`);
  if (!encrypted) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Помилка розшифрування гаманця:', error);
    return null;
  }
};

// Завантаження поточного гаманця
export const loadCurrentWallet = (password) => {
  const currentWalletId = getCurrentWalletId();
  if (!currentWalletId) return null;
  
  return loadWallet(currentWalletId, password);
};

// Перевірка, чи встановлено пароль
export const isPasswordSet = () => {
  return localStorage.getItem(PASSWORD_KEY) === 'true' && getWalletsList().length > 0;
};

// Перейменування гаманця
export const renameWallet = (walletId, newName) => {
  const walletsList = getWalletsList();
  const updatedList = walletsList.map(wallet => {
    if (wallet.id === walletId) {
      return { ...wallet, name: newName };
    }
    return wallet;
  });
  
  localStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(updatedList));
};

// Видалення гаманця
export const deleteWallet = (walletId) => {
  // Видаляємо дані гаманця
  localStorage.removeItem(`wallet_${walletId}`);
  
  // Оновлюємо список гаманців
  const walletsList = getWalletsList();
  const updatedList = walletsList.filter(wallet => wallet.id !== walletId);
  localStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(updatedList));
  
  // Якщо поточний гаманець був видалений, вибираємо інший
  if (getCurrentWalletId() === walletId) {
    const newCurrentWallet = updatedList.length > 0 ? updatedList[0].id : null;
    if (newCurrentWallet) {
      setCurrentWallet(newCurrentWallet);
    } else {
      localStorage.removeItem(CURRENT_WALLET_KEY);
      localStorage.removeItem(PASSWORD_KEY);
    }
  }
  
  return updatedList;
};

// Зберегти налаштування
export const saveSettings = (settings) => {
  localStorage.setItem('wallet_settings', JSON.stringify(settings));
};

// Завантажити налаштування
export const loadSettings = () => {
  const settings = localStorage.getItem('wallet_settings');
  return settings ? JSON.parse(settings) : {
    theme: 'dark',
    gasPrice: 'medium',
    currency: 'USD'
  };
};