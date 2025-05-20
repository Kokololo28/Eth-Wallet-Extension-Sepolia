import { ethers } from "ethers";
import { getProvider } from "./web3";

// Стандартні шаблони ABI
const ERC20_ABI = [
  // Функція name
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
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
  // Функція decimals
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  // Функція totalSupply
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  // Функція balanceOf
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  // Функція transfer
  {
    "constant": false,
    "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  // Функція approve
  {
    "constant": false,
    "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  // Функція allowance
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  // Функція transferFrom
  {
    "constant": false,
    "inputs": [
      {"name": "_from", "type": "address"},
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  // Події Transfer і Approval
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "spender", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
  }
];

// ERC-20 Token шаблон коду Solidity
export const ERC20_TOKEN_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract TOKEN_NAME {
    string public name = "TOKEN_NAME";
    string public symbol = "TOKEN_SYMBOL";
    uint8 public decimals = 18;
    uint256 public totalSupply = TOKEN_TOTAL_SUPPLY * 10 ** decimals;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        _balances[msg.sender] = totalSupply;
    }
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        _allowances[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}`;

// ERC-721 (NFT) шаблон коду Solidity
export const ERC721_TOKEN_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract TOKEN_NAME {
    string public name = "TOKEN_NAME";
    string public symbol = "TOKEN_SYMBOL";
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    constructor() {}
    
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token doesn't exist");
        return owner;
    }
    
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner, "Not the owner");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }
    
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token doesn't exist");
        return _tokenApprovals[tokenId];
    }
    
    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || 
            getApproved(tokenId) == msg.sender || 
            isApprovedForAll(owner, msg.sender),
            "Not authorized"
        );
        require(from == owner, "Not the owner");
        require(to != address(0), "Zero address");
        
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Zero address");
        require(_owners[tokenId] == address(0), "Token already exists");
        
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        emit Transfer(address(0), to, tokenId);
    }
    
    // Функція для генерації нових токенів, яку можна викликати власнику колекції
    function mint(address to, uint256 tokenId) public {
        // Тут можна додати обмеження, щоб тільки власник контракту міг викликати цю функцію
        _mint(to, tokenId);
    }
}`;

// Перевірка чи валідний ABI
export const isValidABI = (abiString) => {
  try {
    const abi = JSON.parse(abiString);
    return Array.isArray(abi);
  } catch (error) {
    return false;
  }
};

// Створення екземпляру контракту
export const createContractInstance = (contractAddress, contractABI) => {
  try {
    const provider = getProvider();
    return new ethers.Contract(contractAddress, contractABI, provider);
  } catch (error) {
    console.error("Помилка створення контракту:", error);
    throw error;
  }
};

// Підготовка контракту для запису (з підписом)
export const getSignedContract = (contractAddress, contractABI, privateKey) => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(contractAddress, contractABI, wallet);
  } catch (error) {
    console.error("Помилка підготовки контракту для запису:", error);
    throw error;
  }
};

// Виклик методу читання з контракту (view, pure)
export const callContractRead = async (contract, methodName, params = []) => {
  try {
    const method = contract[methodName];
    if (!method) {
      throw new Error(`Метод ${methodName} не знайдено в контракті`);
    }
    return await method(...params);
  } catch (error) {
    console.error(`Помилка виклику ${methodName}:`, error);
    throw error;
  }
};

// Виклик методу запису в контракт (транзакція)
export const callContractWrite = async (contract, methodName, params = []) => {
  try {
    const method = contract[methodName];
    if (!method) {
      throw new Error(`Метод ${methodName} не знайдено в контракті`);
    }
    const tx = await method(...params);
    return await tx.wait(); // Очікуємо підтвердження транзакції
  } catch (error) {
    console.error(`Помилка виклику ${methodName}:`, error);
    throw error;
  }
};

// Публікація токену ERC-20
export const deployERC20Token = async (name, symbol, totalSupply, privateKey) => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Підготовка контракту з шаблону
    const tokenCode = ERC20_TOKEN_TEMPLATE
      .replace(/TOKEN_NAME/g, name)
      .replace(/TOKEN_SYMBOL/g, symbol)
      .replace(/TOKEN_TOTAL_SUPPLY/g, totalSupply.toString());
    
    // В реальному додатку тут був би код компіляції контракту
    // Але для демо ми використаємо попередньо скомпільований байткод і ABI
    
    // Замість компіляції ми можемо запропонувати користувачу скопіювати код
    // і використати Remix IDE для розгортання
    
    // Повертаємо підготовлений код контракту
    return {
      success: true,
      contractCode: tokenCode,
      message: "Код контракту згенеровано. Використайте Remix IDE для розгортання в мережі Sepolia."
    };
  } catch (error) {
    console.error("Помилка генерації токену:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Список популярних контрактів у мережі Sepolia
export const POPULAR_CONTRACTS = [
  {
    name: "Chainlink (LINK)",
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    abi: ERC20_ABI
  },
  {
    name: "Wrapped Ether (WETH)",
    address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
    abi: ERC20_ABI
  }
];

// Збереження взаємодії з контрактом у локальне сховище
export const saveContractInteraction = (contractData) => {
  try {
    const savedContracts = getContractInteractions();
    
    // Перевіряємо, чи контракт уже збережено
    const existingIndex = savedContracts.findIndex(
      contract => contract.address.toLowerCase() === contractData.address.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // Оновлюємо існуючий запис
      savedContracts[existingIndex] = {
        ...savedContracts[existingIndex],
        ...contractData,
        lastUsed: Date.now()
      };
    } else {
      // Додаємо новий запис
      savedContracts.push({
        ...contractData,
        id: `contract_${Date.now()}`,
        savedAt: Date.now(),
        lastUsed: Date.now()
      });
    }
    
    localStorage.setItem('saved_contracts', JSON.stringify(savedContracts));
    return true;
  } catch (error) {
    console.error('Помилка збереження взаємодії з контрактом:', error);
    return false;
  }
};

// Отримання збережених взаємодій з контрактами
export const getContractInteractions = () => {
  try {
    const savedContracts = localStorage.getItem('saved_contracts');
    return savedContracts ? JSON.parse(savedContracts) : [];
  } catch (error) {
    console.error('Помилка завантаження взаємодій з контрактами:', error);
    return [];
  }
};