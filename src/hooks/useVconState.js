import { useState, useEffect } from 'react';
import { detectVconType, validateVcon, parseVcon } from '../utils/vconValidator';
import { sampleVcon } from '../data/sampleData';

export const useVconState = () => {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('inspector');
  const [expandedNodes, setExpandedNodes] = useState(new Set(['parties', 'dialog', 'analysis', 'attachments']));
  const [selectedParty, setSelectedParty] = useState(null);
  const [validationResult, setValidationResult] = useState({ status: 'idle' });
  const [vconType, setVconType] = useState('unsigned');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [vconData, setVconData] = useState(null);

  // Auto-detect format and validate
  useEffect(() => {
    const detectedType = detectVconType(input);
    const result = validateVcon(input);
    
    if (detectedType) {
      setVconType(detectedType);
    } else if (result.type) {
      setVconType(result.type);
    }
    setValidationResult(result);
    
    if (result.status === 'valid') {
      setVconData(parseVcon(input));
    } else {
      setVconData(null);
    }
  }, [input]);

  // Set sample data on mount
  useEffect(() => {
    setInput(JSON.stringify(sampleVcon, null, 2));
  }, []);

  const toggleNode = (node) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(node)) {
      newExpanded.delete(node);
    } else {
      newExpanded.add(node);
    }
    setExpandedNodes(newExpanded);
  };

  return {
    // Input state
    input,
    setInput,
    
    // UI state
    activeTab,
    setActiveTab,
    expandedNodes,
    toggleNode,
    selectedParty,
    setSelectedParty,
    
    // Validation state
    validationResult,
    validationStatus: validationResult.status,
    vconType,
    vconData,
    
    // Key management
    showKeyInput,
    setShowKeyInput,
    publicKey,
    setPublicKey,
    privateKey,
    setPrivateKey
  };
};