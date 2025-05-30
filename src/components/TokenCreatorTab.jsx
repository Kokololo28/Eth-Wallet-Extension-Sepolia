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
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Форма для створення токена */}
      {!generatedCode ? (
        <>
          <div className="mb-4">
            <label className="input-label">Тип токену</label>
            <div className="create-tabs">
              <button
                className={`create-tab ${tokenType === 'erc20' ? 'active' : ''}`}
                onClick={() => setTokenType('erc20')}
              >
                ERC-20 (Стандартний)
              </button>
              <button
                className={`create-tab ${tokenType === 'erc721' ? 'active' : ''}`}
                onClick={() => setTokenType('erc721')}
              >
                ERC-721 (NFT)
              </button>
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Назва токену</label>
            <input
              type="text"
              className="input-field"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Наприклад: My Test Token"
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Символ токену</label>
            <input
              type="text"
              className="input-field"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="Наприклад: MTK"
            />
          </div>
          
          {tokenType === 'erc20' && (
            <div className="input-group">
              <label className="input-label">Загальна кількість токенів</label>
              <input
                type="number"
                className="input-field"
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
            className="btn-primary"
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
              className="btn-secondary"
              onClick={() => setGeneratedCode('')}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              ← Повернутися до форми
            </button>
            <button
              className="btn-small"
              onClick={() => copyToClipboard(generatedCode)}
            >
              Копіювати код
            </button>
          </div>
          
          {/* Вікно з кодом */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Згенерований код контракту:</h3>
            <div className="code-box">
              <pre>
                {generatedCode}
              </pre>
            </div>
          </div>
          
          {/* Блок для кнопок */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Наступні кроки:</h3>
            <div className="warning-box">
              <p className="warning-text">
                Для розгортання контракту в тестовій мережі Sepolia, скопіюйте код вище і відкрийте Remix IDE, де ви зможете скомпілювати та розгорнути свій токен.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={openRemix}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}
            >
              Відкрити Remix IDE
            </button>
          </div>
          
          {/* Додаткові інструкції */}
          <div className="address-card">
            <details>
              <summary className="cursor-pointer font-medium mb-2">Покрокові інструкції з розгортання</summary>
              <div className="mt-3">
                <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-300">
                  <li>Скопіюйте код контракту вище</li>
                  <li>Відкрийте Remix IDE (кнопка вище)</li>
                  <li>Створіть новий файл з розширенням .sol</li>
                  <li>Вставте скопійований код</li>
                  <li>Перейдіть на вкладку "Compile" та натисніть кнопку "Compile"</li>
                  <li>Після успішної компіляції перейдіть на вкладку "Deploy"</li>
                  <li>Виберіть "Injected Web3" та підключіть MetaMask до мережі Sepolia</li>
                  <li>Натисніть "Deploy" та підтвердіть транзакцію</li>
                </ol>
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenCreatorTab;