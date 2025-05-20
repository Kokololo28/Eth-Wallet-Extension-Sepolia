import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  isValidABI, createContractInstance, getSignedContract, 
  callContractRead, callContractWrite, saveContractInteraction,
  getContractInteractions, POPULAR_CONTRACTS
} from '../services/contract';

const ContractInteractionTab = ({ wallet }) => {
  const [contractAddress, setContractAddress] = useState('');
  const [contractABI, setContractABI] = useState('');
  const [contractInstance, setContractInstance] = useState(null);
  const [contractMethods, setContractMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodParams, setMethodParams] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewType, setViewType] = useState('interact'); // 'interact', 'history', 'popular'
  const [savedContracts, setSavedContracts] = useState([]);
  
  useEffect(() => {
    // Завантажуємо збережені контракти
    setSavedContracts(getContractInteractions());
  }, []);

  const resetForm = () => {
    setContractInstance(null);
    setContractMethods([]);
    setSelectedMethod(null);
    setMethodParams([]);
    setResult(null);
    setError('');
    setSuccess('');
  };

  const handleContractLoad = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!ethers.utils.isAddress(contractAddress)) {
        throw new Error('Невірна адреса контракту');
      }
      
      if (!isValidABI(contractABI)) {
        throw new Error('Невірний формат ABI');
      }
      
      const abiObj = JSON.parse(contractABI);
      const contract = createContractInstance(contractAddress, abiObj);
      
      // Отримуємо методи контракту з ABI
      const methods = abiObj.filter(item => 
        item.type === 'function'
      ).map(method => ({
        name: method.name,
        inputs: method.inputs || [],
        outputs: method.outputs || [],
        stateMutability: method.stateMutability,
        constant: method.constant,
        isRead: method.constant === true || 
                method.stateMutability === 'view' || 
                method.stateMutability === 'pure'
      }));
      
      setContractInstance(contract);
      setContractMethods(methods);
      setSuccess('Контракт успішно завантажено!');
      
      // Зберігаємо взаємодію з контрактом
      saveContractInteraction({
        address: contractAddress,
        abi: contractABI,
        name: 'Невідомий контракт' // Можна спробувати отримати ім'я з контракту
      });
      
      // Оновлюємо список збережених контрактів
      setSavedContracts(getContractInteractions());
    } catch (error) {
      setError(`Помилка завантаження контракту: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setMethodParams(Array(method.inputs.length).fill(''));
    setResult(null);
  };

  const handleParamChange = (index, value) => {
    const newParams = [...methodParams];
    newParams[index] = value;
    setMethodParams(newParams);
  };

  const handleMethodCall = async () => {
    if (!selectedMethod) return;
    
    setIsLoading(true);
    setError('');
    setResult(null);
    
    try {
      if (selectedMethod.isRead) {
        // Виклик методу тільки для читання
        const res = await callContractRead(contractInstance, selectedMethod.name, methodParams);
        setResult(res.toString());
      } else {
        // Виклик методу для запису (транзакція)
        const signedContract = getSignedContract(
          contractAddress, 
          JSON.parse(contractABI), 
          wallet.privateKey
        );
        
        const tx = await callContractWrite(signedContract, selectedMethod.name, methodParams);
        setResult(JSON.stringify({
          transactionHash: tx.transactionHash,
          blockNumber: tx.blockNumber,
          status: tx.status === 1 ? 'Success' : 'Failed'
        }, null, 2));
      }
      
      setSuccess(`Метод ${selectedMethod.name} успішно виконано!`);
    } catch (error) {
      setError(`Помилка виклику методу: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedContract = (contract) => {
    setContractAddress(contract.address);
    setContractABI(contract.abi);
    resetForm();
    handleContractLoad();
  };

  const loadPopularContract = (contract) => {
    setContractAddress(contract.address);
    setContractABI(JSON.stringify(contract.abi));
    resetForm();
    handleContractLoad();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Взаємодія з контрактами</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded ${viewType === 'interact' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setViewType('interact')}
          >
            Взаємодія
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${viewType === 'history' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setViewType('history')}
          >
            Історія
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${viewType === 'popular' ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={() => setViewType('popular')}
          >
            Популярні
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-2 bg-red-500 text-white rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-500 text-white rounded">{success}</div>}

      {viewType === 'interact' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Адреса контракту</label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">ABI контракту</label>
            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded p-2"
              value={contractABI}
              onChange={(e) => setContractABI(e.target.value)}
              placeholder="[{...}]"
              rows={4}
            />
          </div>

          <button
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={handleContractLoad}
            disabled={isLoading}
          >
            {isLoading ? 'Завантаження...' : 'Завантажити контракт'}
          </button>

          {contractMethods.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Методи контракту</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {contractMethods.map((method, index) => (
                  <button
                    key={index}
                    className={`p-2 rounded text-left ${
                      selectedMethod && selectedMethod.name === method.name
                        ? 'bg-blue-600'
                        : method.isRead ? 'bg-green-700' : 'bg-orange-700'
                    }`}
                    onClick={() => handleMethodSelect(method)}
                  >
                    <div className="font-medium">{method.name}</div>
                    <div className="text-xs text-gray-300">
                      {method.isRead ? 'Read' : 'Write'}
                    </div>
                  </button>
                ))}
              </div>

              {selectedMethod && (
                <div className="bg-gray-800 p-3 rounded border border-gray-700 mb-4">
                  <h4 className="font-medium mb-2">{selectedMethod.name}</h4>
                  
                  {selectedMethod.inputs.length > 0 ? (
                    <div className="mb-3">
                      <p className="text-sm text-gray-400 mb-2">Параметри:</p>
                      {selectedMethod.inputs.map((input, index) => (
                        <div key={index} className="mb-2">
                          <label className="block text-sm font-medium mb-1">
                            {input.name} ({input.type})
                          </label>
                          <input
                            type="text"
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                            value={methodParams[index] || ''}
                            onChange={(e) => handleParamChange(index, e.target.value)}
                            placeholder={`Введіть ${input.type}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">Цей метод не приймає параметрів.</p>
                  )}

                  <button
                    className={`w-full py-2 px-4 rounded text-white ${
                      selectedMethod.isRead ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                    onClick={handleMethodCall}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Обробка...' : selectedMethod.isRead ? 'Викликати' : 'Надіслати транзакцію'}
                  </button>
                </div>
              )}

              {result !== null && (
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <h4 className="font-medium mb-2">Результат:</h4>
                  <pre className="bg-gray-900 p-2 rounded overflow-x-auto">
                    {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewType === 'history' && (
        <div>
          <h3 className="text-lg font-medium mb-2">Раніше використані контракти</h3>
          
          {savedContracts.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              У вас ще немає збережених контрактів
            </div>
          ) : (
            <div className="space-y-2">
              {savedContracts.map((contract) => (
                <div 
                  key={contract.id}
                  className="p-3 bg-gray-800 rounded border border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-700"
                  onClick={() => loadSavedContract(contract)}
                >
                  <div>
                    <div className="font-medium">{contract.name || 'Невідомий контракт'}</div>
                    <div className="text-xs text-gray-400">{contract.address}</div>
                  </div>
                  <div className="text-blue-400">
                    Завантажити
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewType === 'popular' && (
        <div>
          <h3 className="text-lg font-medium mb-2">Популярні контракти в Sepolia</h3>
          
          <div className="space-y-2">
            {POPULAR_CONTRACTS.map((contract, index) => (
              <div 
                key={index}
                className="p-3 bg-gray-800 rounded border border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-700"
                onClick={() => loadPopularContract(contract)}
              >
                <div>
                  <div className="font-medium">{contract.name}</div>
                  <div className="text-xs text-gray-400">{contract.address}</div>
                </div>
                <div className="text-blue-400">
                  Завантажити
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractInteractionTab;