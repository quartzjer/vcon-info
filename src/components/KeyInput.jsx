import React from 'react';

const KeyInput = ({ 
  vconType, 
  publicKey, 
  setPublicKey, 
  privateKey, 
  setPrivateKey 
}) => {
  const isSignedMode = vconType === 'signed';
  const keyValue = isSignedMode ? publicKey : privateKey;
  const setKeyValue = isSignedMode ? setPublicKey : setPrivateKey;
  
  const placeholder = isSignedMode 
    ? "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
    : "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEA...";

  const label = isSignedMode 
    ? 'Public Key (for verification)' 
    : 'Private Key (for decryption)';

  const buttonText = isSignedMode ? 'Verify' : 'Decrypt';

  return (
    <div className="bg-gray-850 border-b border-gray-700 p-4">
      <div className="container mx-auto">
        <div className="max-w-2xl">
          <label className="block text-sm font-medium mb-2">
            {label}
          </label>
          <textarea
            className="w-full h-24 bg-gray-800 border border-gray-700 rounded p-2 font-mono text-sm"
            placeholder={placeholder}
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
              {buttonText}
            </button>
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              Load from File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyInput;