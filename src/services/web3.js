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

// ===== ВИПРАВЛЕНИЙ КОД ПОЧИНАЄТЬСЯ ТУТ =====

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

// ВИПРАВЛЕНА функція для отримання балансу токена
export const getTokenBalance = async (tokenAddress, ownerAddress) => {
  try {
    console.log(`Отримання балансу токена ${tokenAddress} для адреси ${ownerAddress}`);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Отримуємо баланс і десяткові знаки паралельно
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(ownerAddress),
      tokenContract.decimals()
    ]);
    
    console.log(`Сирий баланс: ${balance.toString()}, Десяткові знаки: ${decimals}`);
    
    // Перевіряємо, чи отримали валідні дані
    if (!balance || decimals === undefined || decimals === null) {
      console.error('Не вдалося отримати баланс або десяткові знаки');
      return '0.0';
    }
    
    // Конвертуємо BigNumber в число з правильною кількістю десяткових знаків
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    console.log(`Форматований баланс: ${formattedBalance}`);
    
    // Перевіряємо, чи результат валідний
    if (isNaN(parseFloat(formattedBalance))) {
      console.error('Форматований баланс не є числом:', formattedBalance);
      return '0.0';
    }
    
    return formattedBalance;
  } catch (error) {
    console.error('Помилка отримання балансу токена:', error);
    
    // Спробуємо отримати баланс з 18 десятковими знаками за замовчуванням
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(ownerAddress);
      const formattedBalance = ethers.utils.formatEther(balance); // 18 десяткових знаків
      console.log(`Резервний баланс (18 знаків): ${formattedBalance}`);
      return formattedBalance;
    } catch (fallbackError) {
      console.error('Резервний спосіб також не спрацював:', fallbackError);
      return '0.0';
    }
  }
};

// ВИПРАВЛЕНА функція для отримання інформації про всі токени
export const getAllTokensForAddress = async (address) => {
  const networkName = NETWORK;
  const tokens = COMMON_TOKENS[networkName] || [];
  
  console.log(`Отримання токенів для адреси: ${address}`);
  console.log(`Перевіряємо ${tokens.length} популярних токенів`);
  
  // Отримуємо збережені кастомні токени
  const savedTokens = getCustomTokens();
  console.log(`Знайдено ${savedTokens.length} кастомних токенів`);
  
  const allTokensToCheck = [...tokens, ...savedTokens];
  
  const tokensWithBalance = await Promise.allSettled(
    allTokensToCheck.map(async (token) => {
      try {
        const balance = await getTokenBalance(token.address, address);
        return {
          ...token,
          balance: balance || '0.0'
        };
      } catch (error) {
        console.error(`Помилка для токена ${token.symbol}:`, error);
        return {
          ...token,
          balance: '0.0'
        };
      }
    })
  );
  
  // Обробляємо результати Promise.allSettled
  const validTokens = tokensWithBalance
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(token => {
      // Фільтруємо токени з ненульовим балансом або показуємо всі для тестування
      const hasBalance = parseFloat(token.balance) > 0;
      if (hasBalance) {
        console.log(`Токен ${token.symbol}: ${token.balance}`);
      }
      return true; // Показуємо всі токени для діагностики
    });
  
  // Видаляємо дублікати за адресою
  const uniqueTokens = validTokens.filter((token, index, self) =>
    index === self.findIndex((t) => t.address.toLowerCase() === token.address.toLowerCase())
  );
  
  console.log(`Повертаємо ${uniqueTokens.length} унікальних токенів`);
  return uniqueTokens;
};

// Збереження кастомних токенів
export const saveCustomToken = (token) => {
  const tokens = getCustomTokens();
  
  // Перевіряємо, чи токен уже існує
  const existingIndex = tokens.findIndex(t => 
    t.address.toLowerCase() === token.address.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    // Оновлюємо існуючий токен
    tokens[existingIndex] = { ...tokens[existingIndex], ...token };
  } else {
    // Додаємо новий токен
    tokens.push(token);
  }
  
  localStorage.setItem('custom_tokens', JSON.stringify(tokens));
  console.log('Кастомний токен збережено:', token);
};

// Отримання кастомних токенів
export const getCustomTokens = () => {
  try {
    const tokens = localStorage.getItem('custom_tokens');
    return tokens ? JSON.parse(tokens) : [];
  } catch (error) {
    console.error('Помилка завантаження кастомних токенів:', error);
    return [];
  }
};

// ВИПРАВЛЕНА функція для отримання інформації про токен
export const getTokenInfo = async (tokenAddress) => {
  try {
    console.log(`Отримання інформації про токен: ${tokenAddress}`);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Отримуємо всю інформацію паралельно
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.decimals()
    ]);
    
    const tokenInfo = {
      address: tokenAddress,
      symbol: symbol || 'UNKNOWN',
      name: name || 'Unknown Token',
      decimals: decimals !== undefined ? decimals.toString() : '18'
    };
    
    console.log('Інформація про токен:', tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error('Помилка отримання інформації про токен:', error);
    
    // Повертаємо базову інформацію
    return {
      address: tokenAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: '18'
    };
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

// Відправлення транзакції
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

// Відправлення токенів ERC-20
export const sendTokenTransaction = async (privateKey, tokenAddress, recipientAddress, amount, decimals = 18) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Мінімальний ABI для transfer
    const minABI = [
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      }
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, minABI, wallet);
    
    // Конвертуємо суму з урахуванням decimals
    const value = ethers.utils.parseUnits(amount.toString(), decimals);
    
    // Відправляємо транзакцію
    const tx = await tokenContract.transfer(recipientAddress, value);
    
    // Зберігаємо транзакцію в історію
    saveTransaction(wallet.address, recipientAddress, amount, tx.hash);
    
    return tx;
  } catch (error) {
    console.error('Помилка відправлення токенів:', error);
    throw error;
  }
};