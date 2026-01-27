/**
 * Rule List Component - Displays all automation rules
 */

import React from 'react';

const RuleList = ({ rules, onCreateRule, onEditRule, onToggleRule, onDeleteRule }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Automation Rules</h1>
        <button
          onClick={onCreateRule}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0052CC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          + Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f4f5f7', 
          borderRadius: '4px',
          color: '#6b778c'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '10px' }}>No automation rules created yet.</p>
          <p style={{ fontSize: '14px' }}>Click "Create Rule" to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {rules.map((rule) => (
            <div
              key={rule.ruleId}
              style={{
                border: '1px solid #dfe1e6',
                borderRadius: '4px',
                padding: '16px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    {rule.ruleName}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '14px', color: '#6b778c' }}>
                    <span>
                      <strong>Project:</strong> {rule.projectKey || 'All Projects'}
                    </span>
                    <span>
                      <strong>Status:</strong>{' '}
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: rule.enabled ? '#e3fcef' : '#f4f5f7',
                          color: rule.enabled ? '#006644' : '#6b778c',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onToggleRule(rule.ruleId)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: rule.enabled ? '#f4f5f7' : '#0052CC',
                      color: rule.enabled ? '#42526e' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => onEditRule(rule.ruleId)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f4f5f7',
                      color: '#42526e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteRule(rule.ruleId)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#de350b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dfe1e6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#42526e' }}>Conditions:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#6b778c' }}>
                    {rule.conditions && rule.conditions.length > 0 ? (
                      rule.conditions.map((condition, idx) => (
                        <li key={idx}>
                          {condition.field} {condition.operator} "{condition.value}"
                        </li>
                      ))
                    ) : (
                      <li>No conditions</li>
                    )}
                  </ul>
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#42526e' }}>Actions:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#6b778c' }}>
                    {rule.actions && rule.actions.length > 0 ? (
                      rule.actions.map((action, idx) => (
                        <li key={idx}>
                          {action.type === 'addLabel' && `Add label: "${action.params.label}"`}
                          {action.type === 'createSubtask' && `Create subtask: "${action.params.summary}"`}
                          {action.type === 'reassign' && `Reassign to: ${action.params.assigneeAccountId}`}
                        </li>
                      ))
                    ) : (
                      <li>No actions</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RuleList;
