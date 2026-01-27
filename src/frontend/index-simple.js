/**
 * Simple vanilla JavaScript version for Custom UI
 * This avoids CSP issues with external CDN scripts
 * 
 * Forge bridge is available globally, we'll access it via the bridge API
 */

// Get invoke function from Forge bridge (available globally in Forge environment)
let invoke;
(async () => {
  if (typeof window !== 'undefined' && window.bridge) {
    invoke = window.bridge.invoke;
  } else {
    // Try to import if available
    try {
      const bridge = await import('@forge/bridge');
      invoke = bridge.invoke;
    } catch (e) {
      console.error('Could not load @forge/bridge:', e);
    }
  }
})();

// App state
let rules = [];
let loading = true;
let error = null;
let currentView = 'list';

// DOM elements
const root = document.getElementById('react-root');

// Initialize app
async function init() {
  console.log('App initializing...');
  await fetchRules();
  render();
}

// Fetch rules from backend
async function fetchRules() {
  try {
    loading = true;
    error = null;
    console.log('Fetching rules from resolver...');
    
    const invokeFn = await getInvoke();
    const response = await invokeFn('resolver', {
      functionKey: 'getAllRules',
      payload: {}
    });
    
    console.log('Rules fetched:', response);
    rules = Array.isArray(response) ? response : [];
  } catch (err) {
    console.error('Error fetching rules:', err);
    error = 'Failed to load rules: ' + (err.message || 'Unknown error');
    rules = [];
  } finally {
    loading = false;
    render();
  }
}

// Render the UI
function render() {
  if (!root) {
    console.error('Root element not found');
    return;
  }

  if (error) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="padding: 16px; background-color: #ffebe6; border: 1px solid #de350b; border-radius: 4px; color: #de350b;">
          <strong>Error:</strong> ${error}
          <br />
          <small style="margin-top: 8px; display: block;">
            Please check the browser console (Press F12) for more details.
          </small>
        </div>
      </div>
    `;
    return;
  }

  if (loading) {
    root.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <p>Loading rules...</p>
      </div>
    `;
    return;
  }

  if (currentView === 'list') {
    renderList();
  } else if (currentView === 'create') {
    root.innerHTML = '<p>Create form (to be implemented)</p><button onclick="goBack()">Back</button>';
  } else if (currentView === 'edit') {
    root.innerHTML = '<p>Edit form (to be implemented)</p><button onclick="goBack()">Back</button>';
  }
}

function renderList() {
  const html = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="margin: 0;">Automation Rules</h1>
        <button onclick="createRule()" style="padding: 10px 20px; background-color: #0052CC; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold;">
          + Create Rule
        </button>
      </div>

      ${rules.length === 0 ? `
        <div style="padding: 40px; text-align: center; background-color: #f4f5f7; border-radius: 4px; color: #6b778c;">
          <p style="font-size: 16px; margin-bottom: 10px;">No automation rules created yet.</p>
          <p style="font-size: 14px;">Click "Create Rule" to get started.</p>
        </div>
      ` : `
        <div style="display: grid; gap: 16px;">
          ${rules.map(rule => `
            <div style="border: 1px solid #dfe1e6; border-radius: 4px; padding: 16px; background-color: white;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${escapeHtml(rule.ruleName)}</h3>
                  <div style="display: flex; gap: 16px; margin-bottom: 8px; font-size: 14px; color: #6b778c;">
                    <span><strong>Project:</strong> ${rule.projectKey || 'All Projects'}</span>
                    <span>
                      <strong>Status:</strong>
                      <span style="padding: 2px 8px; border-radius: 3px; background-color: ${rule.enabled ? '#e3fcef' : '#f4f5f7'}; color: ${rule.enabled ? '#006644' : '#6b778c'}; font-weight: bold; font-size: 12px;">
                        ${rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button onclick="toggleRule('${rule.ruleId}')" style="padding: 6px 12px; background-color: ${rule.enabled ? '#f4f5f7' : '#0052CC'}; color: ${rule.enabled ? '#42526e' : 'white'}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    ${rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onclick="editRule()" style="padding: 6px 12px; background-color: #f4f5f7; color: #42526e; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Edit
                  </button>
                  <button onclick="deleteRule('${rule.ruleId}')" style="padding: 6px 12px; background-color: #de350b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Delete
                  </button>
                </div>
              </div>

              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #dfe1e6;">
                <div style="margin-bottom: 8px;">
                  <strong style="font-size: 13px; color: #42526e;">Conditions:</strong>
                  <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; color: #6b778c;">
                    ${rule.conditions && rule.conditions.length > 0 ? 
                      rule.conditions.map(c => `<li>${escapeHtml(c.field)} ${escapeHtml(c.operator)} "${escapeHtml(c.value)}"</li>`).join('') 
                      : '<li>No conditions</li>'}
                  </ul>
                </div>
                <div>
                  <strong style="font-size: 13px; color: #42526e;">Actions:</strong>
                  <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 13px; color: #6b778c;">
                    ${rule.actions && rule.actions.length > 0 ? 
                      rule.actions.map(a => `<li>${formatAction(a)}</li>`).join('') 
                      : '<li>No actions</li>'}
                  </ul>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  root.innerHTML = html;
}

function formatAction(action) {
  if (action.type === 'addLabel') {
    return `Add label: "${escapeHtml(action.params.label)}"`;
  } else if (action.type === 'createSubtask') {
    return `Create subtask: "${escapeHtml(action.params.summary)}"`;
  } else if (action.type === 'reassign') {
    return `Reassign to: ${escapeHtml(action.params.assigneeAccountId)}`;
  }
  return escapeHtml(action.type);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event handlers (exposed globally for onclick)
window.createRule = function() {
  currentView = 'create';
  render();
};

window.editRule = function() {
  currentView = 'edit';
  render();
};

window.goBack = function() {
  currentView = 'list';
  fetchRules();
};

window.toggleRule = async function(ruleId) {
  try {
    const invokeFn = await getInvoke();
    await invokeFn('resolver', {
      functionKey: 'toggleRule',
      payload: { ruleId }
    });
    await fetchRules();
  } catch (err) {
    console.error('Error toggling rule:', err);
    alert('Error toggling rule: ' + (err.message || 'Unknown error'));
  }
};

window.deleteRule = async function(ruleId) {
  if (confirm('Are you sure you want to delete this rule?')) {
    try {
      const invokeFn = await getInvoke();
      await invokeFn('resolver', {
        functionKey: 'deleteRule',
        payload: { ruleId }
      });
      await fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      alert('Error deleting rule: ' + (err.message || 'Unknown error'));
    }
  }
};

// Get invoke function - Forge makes it available
async function getInvoke() {
  if (invoke) return invoke;
  
  // Try multiple methods to get invoke
  if (typeof window !== 'undefined') {
    if (window.bridge && typeof window.bridge.invoke === 'function') {
      invoke = window.bridge.invoke;
      return invoke;
    }
    if (typeof window.invoke === 'function') {
      invoke = window.invoke;
      return invoke;
    }
  }
  
  // Try dynamic import
  try {
    const bridge = await import('@forge/bridge');
    invoke = bridge.invoke;
    return invoke;
  } catch (e) {
    console.error('Could not import @forge/bridge:', e);
    throw new Error('Forge bridge not available');
  }
}

// Initialize when DOM is ready
async function startApp() {
  try {
    invoke = await getInvoke();
    console.log('Forge bridge loaded, initializing app...');
    await init();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const root = document.getElementById('react-root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <div style="padding: 16px; background-color: #ffebe6; border: 1px solid #de350b; border-radius: 4px; color: #de350b;">
            <strong>Error:</strong> Failed to load Forge bridge. Please refresh the page.
            <br />
            <small>Error: ${error.message}</small>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
