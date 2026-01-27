/**
 * Rule Form Component - Shared form for creating and editing rules
 */

import React, { useState, useEffect } from 'react';

const RuleForm = ({ rule, onSubmit, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    ruleName: '',
    projectKey: '',
    enabled: true,
    conditions: [],
    actions: []
  });

  const [newCondition, setNewCondition] = useState({
    field: 'issueType',
    operator: 'equals',
    value: ''
  });

  const [newAction, setNewAction] = useState({
    type: 'addLabel',
    params: {}
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        ruleName: rule.ruleName || '',
        projectKey: rule.projectKey || '',
        enabled: rule.enabled !== undefined ? rule.enabled : true,
        conditions: rule.conditions || [],
        actions: rule.actions || []
      });
    }
  }, [rule]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCondition = () => {
    if (newCondition.value.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, { ...newCondition }]
      }));
      setNewCondition({ field: 'issueType', operator: 'equals', value: '' });
    }
  };

  const handleRemoveCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleAddAction = () => {
    const action = { ...newAction };
    
    // Validate action params based on type
    if (action.type === 'addLabel' && action.params.label) {
      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
      setNewAction({ type: 'addLabel', params: {} });
    } else if (action.type === 'createSubtask' && action.params.summary) {
      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
      setNewAction({ type: 'createSubtask', params: {} });
    } else if (action.type === 'reassign' && action.params.assigneeAccountId) {
      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
      setNewAction({ type: 'reassign', params: {} });
    } else {
      alert('Please fill in all required fields for the action');
    }
  };

  const handleRemoveAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.ruleName.trim()) {
      alert('Rule name is required');
      return;
    }

    if (formData.conditions.length === 0) {
      alert('At least one condition is required');
      return;
    }

    if (formData.actions.length === 0) {
      alert('At least one action is required');
      return;
    }

    onSubmit(formData);
  };

  const conditionFields = [
    { value: 'issueType', label: 'Issue Type' },
    { value: 'projectKey', label: 'Project Key' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'eventType', label: 'Event Type' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'isEmpty', label: 'Is Empty' },
    { value: 'isNotEmpty', label: 'Is Not Empty' }
  ];

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
          Rule Name *
        </label>
        <input
          type="text"
          value={formData.ruleName}
          onChange={(e) => handleInputChange('ruleName', e.target.value)}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #dfe1e6',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          placeholder="e.g., Auto-label high priority bugs"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
          Project Key (optional - leave empty for all projects)
        </label>
        <input
          type="text"
          value={formData.projectKey}
          onChange={(e) => handleInputChange('projectKey', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #dfe1e6',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          placeholder="e.g., PROJ"
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={formData.enabled}
            onChange={(e) => handleInputChange('enabled', e.target.checked)}
          />
          Enabled
        </label>
      </div>

      {/* Conditions Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f4f5f7', borderRadius: '4px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '16px' }}>Conditions *</h3>
        <p style={{ fontSize: '13px', color: '#6b778c', marginBottom: '16px' }}>
          All conditions must be met (AND logic)
        </p>

        {formData.conditions.map((condition, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}
          >
            <span style={{ flex: '1', fontSize: '13px' }}>
              {condition.field} {condition.operator} "{condition.value}"
            </span>
            <button
              type="button"
              onClick={() => handleRemoveCondition(index)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#de350b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          <select
            value={newCondition.field}
            onChange={(e) => setNewCondition(prev => ({ ...prev, field: e.target.value }))}
            style={{
              padding: '8px',
              border: '1px solid #dfe1e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            {conditionFields.map(field => (
              <option key={field.value} value={field.value}>{field.label}</option>
            ))}
          </select>

          <select
            value={newCondition.operator}
            onChange={(e) => setNewCondition(prev => ({ ...prev, operator: e.target.value }))}
            style={{
              padding: '8px',
              border: '1px solid #dfe1e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            {operators.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>

          <input
            type="text"
            value={newCondition.value}
            onChange={(e) => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
            placeholder="Value"
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '8px',
              border: '1px solid #dfe1e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />

          <button
            type="button"
            onClick={handleAddCondition}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0052CC',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            Add Condition
          </button>
        </div>
      </div>

      {/* Actions Section */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f4f5f7', borderRadius: '4px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '16px', fontSize: '16px' }}>Actions *</h3>

        {formData.actions.map((action, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}
          >
            <span style={{ flex: '1', fontSize: '13px' }}>
              {action.type === 'addLabel' && `Add label: "${action.params.label}"`}
              {action.type === 'createSubtask' && `Create subtask: "${action.params.summary}"`}
              {action.type === 'reassign' && `Reassign to: ${action.params.assigneeAccountId}`}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveAction(index)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#de350b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '4px' }}>
          <select
            value={newAction.type}
            onChange={(e) => setNewAction(prev => ({ ...prev, type: e.target.value, params: {} }))}
            style={{
              width: '100%',
              marginBottom: '12px',
              padding: '8px',
              border: '1px solid #dfe1e6',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          >
            <option value="addLabel">Add Label</option>
            <option value="createSubtask">Create Subtask</option>
            <option value="reassign">Reassign Issue</option>
          </select>

          {newAction.type === 'addLabel' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Label *
              </label>
              <input
                type="text"
                value={newAction.params.label || ''}
                onChange={(e) => setNewAction(prev => ({
                  ...prev,
                  params: { label: e.target.value }
                }))}
                placeholder="e.g., urgent"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '12px'
                }}
              />
            </div>
          )}

          {newAction.type === 'createSubtask' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Summary *
              </label>
              <input
                type="text"
                value={newAction.params.summary || ''}
                onChange={(e) => setNewAction(prev => ({
                  ...prev,
                  params: { ...prev.params, summary: e.target.value }
                }))}
                placeholder="Subtask summary"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '12px'
                }}
              />
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Description (optional)
              </label>
              <textarea
                value={newAction.params.description || ''}
                onChange={(e) => setNewAction(prev => ({
                  ...prev,
                  params: { ...prev.params, description: e.target.value }
                }))}
                placeholder="Subtask description"
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '12px',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {newAction.type === 'reassign' && (
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Assignee Account ID *
              </label>
              <input
                type="text"
                value={newAction.params.assigneeAccountId || ''}
                onChange={(e) => setNewAction(prev => ({
                  ...prev,
                  params: { assigneeAccountId: e.target.value }
                }))}
                placeholder="e.g., 557058:abc123def456"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '12px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b778c', margin: '0' }}>
                Enter the Jira account ID of the user to assign to
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddAction}
            style={{
              marginTop: '8px',
              padding: '8px 16px',
              backgroundColor: '#0052CC',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            Add Action
          </button>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f4f5f7',
            color: '#42526e',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: saving ? 0.6 : 1
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: saving ? '#6b778c' : '#0052CC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {saving ? 'Saving...' : 'Save Rule'}
        </button>
      </div>
    </form>
  );
};

export default RuleForm;
