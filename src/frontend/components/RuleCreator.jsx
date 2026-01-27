/**
 * Rule Creator Component - Form to create new automation rules
 */

import React, { useState } from 'react';
import RuleForm from './RuleForm';

let _cachedInvoke = null;
async function getInvoke() {
  if (_cachedInvoke) return _cachedInvoke;

  if (typeof window !== 'undefined') {
    if (window.bridge && typeof window.bridge.invoke === 'function') {
      _cachedInvoke = window.bridge.invoke;
      return _cachedInvoke;
    }
    if (typeof window.invoke === 'function') {
      _cachedInvoke = window.invoke;
      return _cachedInvoke;
    }
  }

  try {
    const bridge = await import('@forge/bridge');
    _cachedInvoke = bridge.invoke;
    return _cachedInvoke;
  } catch (e) {
    console.error('Could not import @forge/bridge dynamically:', e);
    throw new Error('Forge bridge not available');
  }
}

const RuleCreator = ({ onBack, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (ruleData) => {
    try {
      setSaving(true);
      setError(null);
      
      const invokeFn = await getInvoke();
      await invokeFn('resolver', {
        functionKey: 'createRule',
        payload: { rule: ruleData }
      });
      onSave();
    } catch (err) {
      console.error('Error creating rule:', err);
      setError(err.message || 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Create Automation Rule</h1>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f4f5f7',
            color: '#42526e',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to List
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ffebe6',
            border: '1px solid #de350b',
            borderRadius: '4px',
            color: '#de350b',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      )}

      <RuleForm onSubmit={handleSave} onCancel={onBack} saving={saving} />
    </div>
  );
};

export default RuleCreator;
