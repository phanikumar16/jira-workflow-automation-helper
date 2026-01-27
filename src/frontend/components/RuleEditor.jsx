/**
 * Rule Editor Component - Form to edit existing automation rules
 */

import React, { useState, useEffect } from 'react';
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

const RuleEditor = ({ ruleId, onBack, onSave }) => {
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRule();
  }, [ruleId]);

  const fetchRule = async () => {
    try {
      setLoading(true);
      const invokeFn = await getInvoke();
      const ruleData = await invokeFn('resolver', {
        functionKey: 'getRule',
        payload: { ruleId }
      });
      setRule(ruleData);
    } catch (err) {
      console.error('Error fetching rule:', err);
      setError('Failed to load rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (ruleData) => {
    try {
      setSaving(true);
      setError(null);
      
      const invokeFn = await getInvoke();
      await invokeFn('resolver', {
        functionKey: 'updateRule',
        payload: { ruleId, updates: ruleData }
      });
      onSave();
    } catch (err) {
      console.error('Error updating rule:', err);
      setError(err.message || 'Failed to update rule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading rule...</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Edit Rule</h1>
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
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffebe6',
            border: '1px solid #de350b',
            borderRadius: '4px',
            color: '#de350b'
          }}
        >
          Rule not found
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Edit Automation Rule</h1>
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

      <RuleForm rule={rule} onSubmit={handleSave} onCancel={onBack} saving={saving} />
    </div>
  );
};

export default RuleEditor;
