/**
 * Main React App for Jira Workflow Automation Helper Custom UI
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import RuleList from './components/RuleList';
import RuleCreator from './components/RuleCreator';
import RuleEditor from './components/RuleEditor';

// Use global Forge bridge when available (avoid bare module imports in browser)
let _cachedInvoke = null;
let _bridgeReady = false;

async function initializeBridge() {
  if (_bridgeReady) return;
  
  try {
    // In Forge Custom UI, the bridge is loaded globally via a script
    const bridge = await import('@forge/bridge');
    console.log('Bridge imported successfully');
    _bridgeReady = true;
    return bridge;
  } catch (e) {
    console.error('Failed to import @forge/bridge:', e);
    // The bridge might be available globally even if import fails
    if (typeof window !== 'undefined' && window.bridge) {
      _bridgeReady = true;
      return window.bridge;
    }
    throw new Error('Forge bridge not available. Make sure you are accessing this from a Jira Custom UI.');
  }
}

async function getInvoke() {
  if (_cachedInvoke) return _cachedInvoke;

  try {
    const bridge = await initializeBridge();
    if (bridge && typeof bridge.invoke === 'function') {
      _cachedInvoke = bridge.invoke;
    } else if (typeof window !== 'undefined' && window.invoke && typeof window.invoke === 'function') {
      _cachedInvoke = window.invoke;
    } else if (typeof window !== 'undefined' && window.bridge && typeof window.bridge.invoke === 'function') {
      _cachedInvoke = window.bridge.invoke;
    } else {
      throw new Error('Forge invoke function not found');
    }
    return _cachedInvoke;
  } catch (e) {
    console.error('Error getting invoke function:', e);
    throw e;
  }
}

const App = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if required dependencies are available
  useEffect(() => {
    if (typeof React === 'undefined') {
      setError('React library not loaded. Please check browser console.');
      setLoading(false);
      return;
    }
    console.log('App initialized, React is available');
  }, []);

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching rules from resolver...');
      
      // Add timeout to detect hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout: The API call took too long (>10 seconds)')), 10000);
      });
      
      const invokeFn = await getInvoke();
      const invokePromise = invokeFn('resolver', {
        functionKey: 'getAllRules',
        payload: {}
      });
      
      const response = await Promise.race([invokePromise, timeoutPromise]);
      
      console.log('Rules fetched:', response);
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        setRules(response);
      } else {
        console.warn('Unexpected response format:', response);
        setRules([]);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      const errorMessage = error.message || 'Unknown error';
      setError('Failed to load rules: ' + errorMessage);
      setRules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setSelectedRuleId(null);
    setView('create');
  };

  const handleEditRule = (ruleId) => {
    setSelectedRuleId(ruleId);
    setView('edit');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedRuleId(null);
    fetchRules(); // Refresh rules list
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const invokeFn = await getInvoke();
      await invokeFn('resolver', {
        functionKey: 'toggleRule',
        payload: { ruleId }
      });
      fetchRules(); // Refresh rules list
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        const invokeFn = await getInvoke();
        await invokeFn('resolver', {
          functionKey: 'deleteRule',
          payload: { ruleId }
        });
        fetchRules(); // Refresh rules list
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#ffebe6',
          border: '1px solid #de350b',
          borderRadius: '4px',
          color: '#de350b',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <small style={{ marginTop: '8px', display: 'block' }}>
            Please check the browser console (Press F12) for more details.
          </small>
        </div>
      </div>
    );
  }

  if (loading && view === 'list') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading rules...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {view === 'list' && (
        <RuleList
          rules={rules}
          onCreateRule={handleCreateRule}
          onEditRule={handleEditRule}
          onToggleRule={handleToggleRule}
          onDeleteRule={handleDeleteRule}
        />
      )}
      {view === 'create' && (
        <RuleCreator onBack={handleBackToList} onSave={handleBackToList} />
      )}
      {view === 'edit' && (
        <RuleEditor
          ruleId={selectedRuleId}
          onBack={handleBackToList}
          onSave={handleBackToList}
        />
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('react-root'));
