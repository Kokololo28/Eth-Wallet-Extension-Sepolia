import React, { useState } from 'react';
import { deployERC20Token, ERC20_TOKEN_TEMPLATE, ERC721_TOKEN_TEMPLATE } from '../services/contract';

const TokenCreatorTab = ({ wallet }) => {
  const [tokenType, setTokenType] = useState('erc20');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remixUrl, setRemixUrl] = useState('');

  const generateToken = async () => {
    if (!tokenName || !tokenSymbol) {
      setError('Введіть назву та символ токену');
      return;
    }

    if (tokenType === 'erc20' && (!totalSupply || isNaN(Number(totalSupply)))) {
      setError('Введіть коректну загальну кількість токенів');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setGeneratedCode('');
    setRemixUrl('');

    try {
      let tokenCode;
      
      if (tokenType === 'erc20') {
        const result = await deployERC20Token(
          tokenName, 
          tokenSymbol, 
          totalSupply, 
          wallet.privateKey
        );
        
        if (result.success) {
          tokenCode = result.contractCode;
          setSuccess("Код токену успішно згенеровано");
        } else {
          throw new Error(result.message);
        }
      } else if (tokenType === 'erc721') {
        // Для NFT токена
        tokenCode = ERC721_TOKEN_TEMPLATE
          .replace(/TOKEN_NAME/g, tokenName)
          .replace(/TOKEN_SYMBOL/g, tokenSymbol);
          
        setSuccess("Код NFT токену успішно згенеровано");
      }
      
      setGeneratedCode(tokenCode);
      setRemixUrl('https://remix.ethereum.org/');
    } catch (error) {
      setError(`Помилка генерації токену: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Код скопійовано в буфер обміну!');
    setTimeout(() => {
      if (success === 'Код скопійовано в буфер обміну!') {
        setSuccess('');
      }
    }, 3000);
  };

  const openRemix = () => {
    window.open(remixUrl, '_blank');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Створення власного токену</h2>
      
      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-500 text-white rounded">{success}</div>}

      {/* Форма для створення токена */}
      {!generatedCode ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Тип токену</label>
            <div className="flex rounded-md overflow-hidden border border-gray-600">
              <button
                className={`flex-1 py-2 px-4 ${tokenType === 'erc20' ? 'bg-blue-600' : 'bg-gray-800'}`}
                onClick={() => setTokenType('erc20')}
              >
                ERC-20 (Стандартний)
              </button>
              <button
                className={`flex-1 py-2 px-4 ${tokenType === 'erc721' ? 'bg-blue-600' : 'bg-gray-800'}`}
                onClick={() => setTokenType('erc721')}
              >
                ERC-721 (NFT)
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Назва токену</label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Наприклад: My Test Token"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Символ токену</label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="Наприклад: MTK"
            />
          </div>
          
          {tokenType === 'erc20' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Загальна кількість токенів</label>
              <input
                type="number"
                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                placeholder="Наприклад: 1000000"
              />
              <p className="text-xs text-gray-400 mt-1">
                Буде згенеровано {totalSupply || '0'} токенів з 18 десятковими знаками
              </p>
            </div>
          )}
          
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4"
            onClick={generateToken}
            disabled={isLoading}
          >
            {isLoading ? 'Генерація...' : 'Згенерувати токен'}
          </button>
        </>
      ) : (
        /* Відображення згенерованого коду */
        <>
          <div className="mb-4 flex justify-between">
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded text-sm"
              onClick={() => setGeneratedCode('')}
            >
              ← Повернутися до форми
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
              onClick={() => copyToClipboard(generatedCode)}
            >
              Копіювати код
            </button>
          </div>
          
          {/* Вікно з кодом - ОКРЕМИЙ КОМПОНЕНТ */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Згенерований код контракту:</h3>
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <pre className="text-xs overflow-y-auto" style={{ maxHeight: '250px', whiteSpace: 'pre-wrap' }}>
                {generatedCode}
              </pre>
            </div>
          </div>
          
          {/* ОКРЕМИЙ БЛОК для кнопок */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Наступні кроки:</h3>
            <div className="bg-yellow-800 p-3 rounded border border-yellow-700">
              <p className="text-sm text-yellow-200 mb-3">
                Для розгортання контракту в тестовій мережі Sepolia, скопіюйте код вище і відкрийте Remix IDE, де ви зможете скомпілювати та розгорнути свій токен.
              </p>
              <button
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
                onClick={openRemix}
              >
                Відкрити Remix IDE
              </button>
            </div>
          </div>
          
          {/* Додаткові інструкції */}
          <div className="mt-4 bg-gray-800 p-3 rounded">
            <details>
              <summary className="cursor-pointer font-medium mb-2">Покрокові інструкції з розгортання</summary>
              <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-300">
                <li>Скопіюйте код контракту вище</li>
                <li>Відкрийте Remix IDE (кнопка вище)</li>
                <li>Створіть новий файл з розширенням .sol</li>
                <li>Вставте скопійований код</li>
                <li>Перейдіть на вкладку "Compile" та натисніть кнопку "Compile"</li>
                <li>Після успішної компіляції перейдіть на вкладку "Deploy"</li>
                <li>Виберіть "Injected Web3" та підключіть MetaMask до мережі Sepolia</li>
                <li>Натисніть "Deploy" та підтвердіть транзакцію</li>
              </ol>
            </details>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenCreatorTab;