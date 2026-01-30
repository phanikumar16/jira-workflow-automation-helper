/**
 * Jira Workflow Automation Helper - Custom UI
 * Rule Management Interface
 */

import { invoke } from '@forge/bridge';

const API = {
  getAllRules: async () => {
    try {
      const result = await invoke('getAllRules');
      return result || [];
    } catch (e) {
      console.error('[API] Forge bridge error:', e);
      return [];
    }
  },
  createRule: async (rule) => {
    try {
      await invoke('createRule', { rule });
    } catch (e) {
      console.error('[API] Failed to create rule:', e);
      throw e;
    }
  },
  updateRule: async (ruleId, updates) => {
    try {
      await invoke('updateRule', { ruleId, updates });
    } catch (e) {
      console.error('[API] Failed to update rule:', e);
      throw e;
    }
  },
  deleteRule: async (ruleId) => {
    try {
      await invoke('deleteRule', { ruleId });
    } catch (e) {
      console.error('[API] Failed to delete rule:', e);
      throw e;
    }
  },
  toggleRule: async (ruleId) => {
    try {
      await invoke('toggleRule', { ruleId });
    } catch (e) {
      console.error('[API] Failed to toggle rule:', e);
      throw e;
    }
  }
};

// Manual sync function for development (when bridge isn't available)
async function syncRulesToForgeStorage() {
  try {
    console.log('[SYNC] Starting manual sync to Forge storage...');
    const stored = localStorage.getItem('automation-rules');
    if (!stored) {
      alert('No rules in localStorage to sync');
      return;
    }
    
    const rules = JSON.parse(stored);
    console.log('[SYNC] Found', rules.length, 'rules in localStorage');
    
    // Try to sync via resolver
    if (typeof bridge !== 'undefined' && bridge) {
      try {
        const result = await bridge.invoke('saveRules', { rules });
        console.log('[SYNC] Successfully synced to Forge storage');
        alert('✓ Rules synced to Forge storage! The backend will now see them.');
        return;
      } catch (e) {
        console.error('[SYNC] Resolver sync failed:', e);
        alert('Bridge is defined but invoke failed: ' + e.message);
      }
    } else {
      alert('Cannot sync - bridge not available. This is a development environment limitation.');
    }
  } catch (e) {
    console.error('[SYNC] Sync error:', e);
    alert('Error syncing: ' + e.message);
  }
}

// Rule state management
let rules = [];

let currentPage = 'list'; // list, create, edit

const PRIORITIES = ['Critical', 'Highest', 'High', 'Medium', 'Low', 'Lowest', 'Informational'];
const ISSUE_TYPES = ['Bug', 'Task', 'Story', 'Sub-task', 'Epic'];
const STATUSES = ['Open', 'In Progress', 'In Review', 'Done', 'Backlog', 'To Do', 'Closed'];
const ACTIONS = ['addLabel', 'createSubtask', 'assignIssue', 'updateField'];
const CONDITION_FIELDS = ['issueType', 'priority', 'status', 'projectKey', 'assignee', 'labels'];
const OPERATORS = {
  issueType: ['equals'],
  priority: ['equals', 'in'],
  status: ['equals'],
  projectKey: ['equals'],
  assignee: ['isEmpty', 'isNotEmpty', 'equals'],
  labels: ['contains', 'notContains']
};

// ===== RENDER FUNCTIONS =====

async function renderApp() {
  try {
    rules = await API.getAllRules();
  } catch (error) {
    console.error('Error fetching rules:', error);
    rules = [];
  }
  
  if (currentPage === 'list') {
    renderRulesList();
  } else if (currentPage === 'create') {
    renderCreateForm();
  } else if (currentPage === 'edit') {
    renderEditForm();
  }
}

function renderRulesList() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>Automation Rules</h1>
        <div class="header-buttons">
          <button id="btn-create" class="btn btn-primary">+ Create Rule</button>
          <button id="btn-debug" class="btn btn-secondary" style="margin-left: 10px;">Debug Storage</button>
        </div>
      </div>
      
      <div id="rules-list" class="rules-list">
        ${rules.length === 0 ? 
          '<p class="no-rules">No automation rules yet. Create one to get started.</p>' :
          rules.map(rule => `
            <div class="rule-card" data-rule-id="${rule.id}">
              <div class="rule-header">
                <div class="rule-title">
                  <h3>${rule.name}</h3>
                  <p class="rule-desc">${rule.description || 'No description'}</p>
                </div>
                <div class="rule-status">
                  <label class="toggle-switch">
                    <input type="checkbox" class="toggle-rule" ${rule.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="rule-details">
                <div class="detail-item">
                  <strong>Trigger:</strong> ${rule.trigger}
                </div>
                <div class="detail-item">
                  <strong>Conditions:</strong> ${formatConditions(rule.conditions)}
                </div>
                <div class="detail-item">
                  <strong>Actions:</strong> ${formatActions(rule.actions)}
                </div>
              </div>
              
              <div class="rule-actions">
                <button class="btn-edit" data-rule-id="${rule.id}">Edit</button>
                <button class="btn-delete" data-rule-id="${rule.id}">Delete</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
  
  attachListenersList();
}

function renderCreateForm() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>Create New Rule</h1>
      </div>
      
      <form id="rule-form" class="rule-form">
        <div class="form-group">
          <label>Rule Name *</label>
          <input type="text" id="rule-name" required placeholder="e.g., Auto-assign Critical Issues">
        </div>
        
        <div class="form-group">
          <label>Description</label>
          <textarea id="rule-desc" placeholder="What does this rule do?"></textarea>
        </div>
        
        <div class="form-group">
          <label>Trigger Type *</label>
          <select id="rule-trigger" required>
            <option value="">Select trigger</option>
            <option value="created">Issue Created</option>
            <option value="updated">Issue Updated</option>
            <option value="both">Both (Created & Updated)</option>
          </select>
        </div>
        
        <!-- CONDITIONS -->
        <div class="form-section">
          <h3>Conditions (AND Logic)</h3>
          <div id="conditions-container"></div>
          <button type="button" id="btn-add-condition" class="btn btn-secondary">+ Add Condition</button>
        </div>
        
        <!-- ACTIONS -->
        <div class="form-section">
          <h3>Actions (Execute in Order)</h3>
          <div id="actions-container"></div>
          <button type="button" id="btn-add-action" class="btn btn-secondary">+ Add Action</button>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create Rule</button>
          <button type="button" id="btn-cancel" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `;
  
  // Initialize with empty condition and action
  addConditionRow();
  addActionRow();
  
  attachListenersForm();
}

function renderEditForm() {
  // Similar to create, but pre-filled
  renderCreateForm(); // Can enhance later for edit mode
}

// ===== FORM HELPERS =====

function addConditionRow() {
  const container = document.getElementById('conditions-container');
  const index = container.children.length;
  
  const html = `
    <div class="condition-row" data-index="${index}">
      <select class="condition-field" required>
        <option value="">Select field</option>
        ${CONDITION_FIELDS.map(f => `<option value="${f}">${f}</option>`).join('')}
      </select>
      
      <select class="condition-operator" required>
        <option value="">Select operator</option>
      </select>
      
      <input type="text" class="condition-value" placeholder="Value">
      
      <button type="button" class="btn-remove-condition" data-index="${index}">Remove</button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', html);
}

function addActionRow() {
  const container = document.getElementById('actions-container');
  const index = container.children.length;
  
  const html = `
    <div class="action-row" data-index="${index}">
      <select class="action-type" required>
        <option value="">Select action</option>
        <option value="addLabel">Add Label</option>
        <option value="createSubtask">Create Subtask</option>
        <option value="assignIssue">Assign Issue</option>
        <option value="updateField">Update Field</option>
      </select>
      
      <div class="action-params">
        <!-- Dynamic based on action type -->
      </div>
      
      <button type="button" class="btn-remove-action" data-index="${index}">Remove</button>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', html);
}

// ===== FORMAT HELPERS =====

function formatConditions(conditions) {
  if (!conditions || conditions.length === 0) return 'None';
  return conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(' AND ');
}

function formatActions(actions) {
  if (!actions || actions.length === 0) return 'None';
  return actions.map(a => `${a.type}${a.params ? '(' + Object.values(a.params).join(', ') + ')' : ''}`).join(' → ');
}

// ===== EVENT LISTENERS =====

function attachListenersList() {
  document.getElementById('btn-create').addEventListener('click', () => {
    currentPage = 'create';
    renderApp();
  });
  
  // Debug button
  const debugBtn = document.getElementById('btn-debug');
  if (debugBtn) {
    debugBtn.addEventListener('click', async () => {
      console.log('[DEBUG] Calling debugStorage resolver...');
      if (typeof bridge !== 'undefined' && bridge) {
        try {
          const result = await bridge.invoke('debugStorage');
          console.log('[DEBUG] Storage result:', result);
          alert('Storage Debug:\n' + JSON.stringify(result, null, 2));
        } catch (e) {
          console.error('[DEBUG] Error:', e);
          alert('Error: ' + e.message);
        }
      } else {
        console.log('[DEBUG] Bridge not available');
        const stored = localStorage.getItem('automation-rules');
        const msg = 'Bridge NOT available.\n\nLocalStorage has rules: ' + (stored ? 'YES' : 'NO') + 
                    '\n\nClick OK to SYNC rules from localStorage to Forge storage (manual workaround)';
        if (confirm(msg)) {
          await syncRulesToForgeStorage();
        }
      }
    });
  }
  
  document.querySelectorAll('.toggle-rule').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const ruleId = e.target.closest('.rule-card').dataset.ruleId;
      await API.toggleRule(ruleId);
      await renderApp();
    });
  });
  
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // TODO: Implement edit mode (fetch rule and show form)
      alert('Edit mode coming soon');
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const ruleId = e.target.dataset.ruleId;
      if (confirm('Delete this rule?')) {
        await API.deleteRule(ruleId);
        await renderApp();
      }
    });
  });
}

function attachListenersForm() {
  // Add condition
  document.getElementById('btn-add-condition').addEventListener('click', (e) => {
    e.preventDefault();
    addConditionRow();
  });
  
  // Add action
  document.getElementById('btn-add-action').addEventListener('click', (e) => {
    e.preventDefault();
    addActionRow();
  });
  
  // Remove condition
  document.querySelectorAll('.btn-remove-condition').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.closest('.condition-row').remove();
    });
  });
  
  // Remove action
  document.querySelectorAll('.btn-remove-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.target.closest('.action-row').remove();
    });
  });
  
  // Field change for operator
  document.querySelectorAll('.condition-field').forEach(select => {
    select.addEventListener('change', (e) => {
      const field = e.target.value;
      const operatorSelect = e.target.closest('.condition-row').querySelector('.condition-operator');
      const ops = OPERATORS[field] || [];
      operatorSelect.innerHTML = `<option value="">Select operator</option>` + 
        ops.map(op => `<option value="${op}">${op}</option>`).join('');
    });
  });
  
  // Form submit
  document.getElementById('rule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('rule-name').value;
    const description = document.getElementById('rule-desc').value;
    const trigger = document.getElementById('rule-trigger').value;
    
    // Collect conditions
    const conditions = [];
    document.querySelectorAll('.condition-row').forEach(row => {
      const field = row.querySelector('.condition-field').value;
      const operator = row.querySelector('.condition-operator').value;
      const value = row.querySelector('.condition-value').value;
      
      if (field && operator && value) {
        conditions.push({ field, operator, value });
      }
    });
    
    // Collect actions
    const actions = [];
    document.querySelectorAll('.action-row').forEach(row => {
      const type = row.querySelector('.action-type').value;
      if (type) {
        actions.push({ type, params: {} }); // TODO: Collect params
      }
    });
    
    if (!name || !trigger || conditions.length === 0 || actions.length === 0) {
      alert('Please fill all required fields');
      return;
    }
    
    const rule = {
      id: 'rule-' + Date.now(),
      name,
      description,
      trigger,
      conditions,
      actions,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    
    await API.createRule(rule);
    currentPage = 'list';
    await renderApp();
  });
  
  // Cancel
  document.getElementById('btn-cancel').addEventListener('click', () => {
    currentPage = 'list';
    renderApp();
  });
}

// saveRules is no longer needed; all CRUD is via backend

// ===== INIT =====

async function init() {
  console.log('Initializing Jira Workflow Automation Helper');
  renderApp();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
