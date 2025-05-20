import { ethers } from "ethers";

// Тестова мережа - використовуйте Sepolia або Goerli
const NETWORK = "sepolia";
// Замініть на ваш API ключ Infura
const API_KEY = "a64f87a7510d406d9b7d6ef8114c38f0";

const provider = new ethers.providers.JsonRpcProvider(
  `https://${NETWORK}.infura.io/v3/${API_KEY}`
);

export const getProvider = () => provider;

// Створення екземпляру гаманця
export const createWallet = () => {
  const wallet = ethers.Wallet.createRandom().connect(provider);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
};

// Імпорт гаманця через приватний ключ
export const importWalletFromPrivateKey = (privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    throw new Error("Неправильний приватний ключ");
  }
};

// Імпорт гаманця через мнемонічну фразу
export const importWalletFromMnemonic = (mnemonic) => {
  try {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic
    };
  } catch (error) {
    throw new Error("Неправильна мнемонічна фраза");
  }
};

// Отримання балансу гаманця
export const getBalance = async (address) => {
  try {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error("Помилка отримання балансу:", error);
    return "0.0";
  }
};

// ===== НОВИЙ КОД ПОЧИНАЄТЬСЯ ТУТ =====

// Стандартний ABI для ERC-20 токенів
const ERC20_ABI = [
  // Функція balanceOf
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  // Функція decimals
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  // Функція symbol
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  // Функція name
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

// Перелік популярних токенів у тестовій мережі
const COMMON_TOKENS = {
  sepolia: [
    { address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', symbol: 'LINK', name: 'Chainlink' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap' }
  ],
  goerli: [
    { address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', symbol: 'WETH', name: 'Wrapped Ether' },
    { address: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', symbol: 'USDC', name: 'USD Coin' },
    { address: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB', symbol: 'LINK', name: 'Chainlink' }
  ]
};

// Отримати баланс конкретного токена
export const getTokenBalance = async (tokenAddress, ownerAddress) => {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(ownerAddress);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Помилка отримання балансу токена:', error);
    return '0.0';
  }
};

// Отримати інформацію про всі токени для адреси
export const getAllTokensForAddress = async (address) => {
  const networkName = NETWORK; // Використовуємо поточну мережу (sepolia або goerli)
  const tokens = COMMON_TOKENS[networkName] || [];
  
  const tokensWithBalance = await Promise.all(
    tokens.map(async (token) => {
      const balance = await getTokenBalance(token.address, address);
      return {
        ...token,
        balance
      };
    })
  );
  
  // Повертаємо тільки токени з ненульовим балансом + додаткові токени з localStorage
  const savedTokens = getCustomTokens();
  const allTokens = [...tokensWithBalance, ...savedTokens];
  
  // Видаляємо дублікати за адресою
  const uniqueTokens = allTokens.filter((token, index, self) =>
    index === self.findIndex((t) => t.address === token.address)
  );
  
  return uniqueTokens;
};

// Збереження кастомних токенів
export const saveCustomToken = (token) => {
  const tokens = getCustomTokens();
  tokens.push(token);
  localStorage.setItem('custom_tokens', JSON.stringify(tokens));
};

// Отримання кастомних токенів
export const getCustomTokens = () => {
  const tokens = localStorage.getItem('custom_tokens');
  return tokens ? JSON.parse(tokens) : [];
};

// Отримання інформації про токен за адресою
export const getTokenInfo = async (tokenAddress) => {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const symbol = await tokenContract.symbol();
    const name = await tokenContract.name();
    const decimals = await tokenContract.decimals();
    
    return {
      address: tokenAddress,
      symbol,
      name,
      decimals: decimals.toString()
    };
  } catch (error) {
    console.error('Помилка отримання інформації про токен:', error);
    return null;
  }
};

// Отримання історії транзакцій (використовуємо Etherscan API для тестових мереж)
export const getTransactionHistory = (address) => {
  // В реальному додатку тут був би запит до Etherscan API
  // Оскільки це тестовий гаманець, створимо моковані дані
  
  // Перевіряємо, чи є збережені транзакції в localStorage
  const savedTxs = localStorage.getItem(`transactions_${address}`);
  const transactions = savedTxs ? JSON.parse(savedTxs) : [];
  
  return transactions;
};

// Збереження транзакції в історію
export const saveTransaction = (fromAddress, toAddress, amount, hash) => {
  const transactions = getTransactionHistory(fromAddress) || [];
  
  const newTx = {
    hash,
    from: fromAddress,
    to: toAddress,
    value: amount,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  transactions.unshift(newTx); // Додаємо на початок масиву
  localStorage.setItem(`transactions_${fromAddress}`, JSON.stringify(transactions));
  
  // Імітуємо підтвердження транзакції через певний час
  setTimeout(() => {
    updateTransactionStatus(hash, fromAddress, Math.random() > 0.1 ? 'success' : 'failed');
  }, 5000);
};

// Оновлення статусу транзакції
export const updateTransactionStatus = (hash, fromAddress, status, errorMessage = '') => {
  const transactions = getTransactionHistory(fromAddress);
  const updatedTxs = transactions.map(tx => {
    if (tx.hash === hash) {
      return { ...tx, status, errorMessage };
    }
    return tx;
  });
  
  localStorage.setItem(`transactions_${fromAddress}`, JSON.stringify(updatedTxs));
};

// ===== ВІДРЕДАГУЙТЕ ІСНУЮЧУ ФУНКЦІЮ ВІДПРАВЛЕННЯ ТРАНЗАКЦІЇ =====

// Оновимо функцію відправлення транзакції, щоб зберігати історію
export const sendTransaction = async (privateKey, toAddress, amount) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.utils.parseEther(amount.toString())
    });
    
    // Зберігаємо транзакцію в історію
    saveTransaction(wallet.address, toAddress, amount, tx.hash);
    
    return tx;
  } catch (error) {
    console.error('Помилка відправлення транзакції:', error);
    throw error;
  }
};