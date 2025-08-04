import React from 'react';
import { useVconState } from '../hooks/useVconState';
import Header from './Header';
import ValidationStatusBar from './ValidationStatusBar';
import KeyInput from './KeyInput';
import InputPane from './InputPane';
import InspectorPane from './InspectorPane';
import Footer from './Footer';

const VConInspector = () => {
  const {
    input,
    setInput,
    activeTab,
    setActiveTab,
    expandedNodes,
    toggleNode,
    selectedParty,
    setSelectedParty,
    validationResult,
    validationStatus,
    vconType,
    vconData,
    showKeyInput,
    setShowKeyInput,
    publicKey,
    setPublicKey,
    privateKey,
    setPrivateKey
  } = useVconState();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      
      <ValidationStatusBar 
        validationResult={validationResult}
        validationStatus={validationStatus}
        vconType={vconType}
        showKeyInput={showKeyInput}
        setShowKeyInput={setShowKeyInput}
      />

      {showKeyInput && (
        <KeyInput 
          vconType={vconType}
          publicKey={publicKey}
          setPublicKey={setPublicKey}
          privateKey={privateKey}
          setPrivateKey={setPrivateKey}
        />
      )}

      <div className="flex-1 container mx-auto px-4 py-6 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{height: 'calc(100vh - 200px)'}}>
          <InputPane 
            input={input}
            setInput={setInput}
          />
          
          <InspectorPane 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            vconData={vconData}
            vconType={vconType}
            validationStatus={validationStatus}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            selectedParty={selectedParty}
            setSelectedParty={setSelectedParty}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VConInspector;