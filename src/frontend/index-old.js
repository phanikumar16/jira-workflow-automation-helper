// Automation Rules - Dual storage (localStorage + Forge)
const storage = {
  getAllRules: async () => {
    const rules = JSON.parse(localStorage.getItem('automation-rules') || '[]');
    console.log('Loaded rules from localStorage:', rules.length, 'rules');
    return rules;
  },
  
  saveRules: async (rules) => {
    // Save to localStorage (immediate)
    localStorage.setItem('automation-rules', JSON.stringify(rules));
    console.log('Saved', rules.length, 'rules to localStorage');
    
    // Try to save to Forge storage (backend) for global use
    try {
      if (window.AP?.invoke) {
        console.log('Syncing rules to Forge storage...');
        const result = await Promise.race([
          window.AP.invoke('resolver', { 
            functionKey: 'saveRules',
            payload: { rules } 
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        console.log('Rules synced to Forge storage:', result);
      }
    } catch (e) {
      console.log('Forge storage sync failed (but localStorage is safe):', e.message);
    }
  },
  
  addRule: async (rule) => {
    const rules = await storage.getAllRules();
    rules.push({ ...rule, id: Date.now() });
    await storage.saveRules(rules);
  },
  
  deleteRule: async (id) => {
    const rules = await storage.getAllRules();
    const filtered = rules.filter(r => r.id !== id);
    await storage.saveRules(filtered);
  },
  
  toggleRule: async (id) => {
    const rules = await storage.getAllRules();
    const rule = rules.find(r => r.id === id);
    if (rule) rule.enabled = !rule.enabled;
    await storage.saveRules(rules);
  }
};

// Attach event listeners to buttons
function attachEventListeners() {
  const createBtn = document.getElementById('btn-create-rule');
  if (createBtn) {
    createBtn.addEventListener('click', showCreateForm);
  }

  document.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.deleteId);
      deleteRule(id);
    });
  });

  document.querySelectorAll('[data-toggle-id]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.toggleId);
      toggleRule(id);
    });
  });

  const submitBtn = document.querySelector('[data-form-submit]');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleCreateRule);
  }

  const cancelBtn = document.querySelector('[data-form-cancel]');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', render);
  }

  // Add listeners for form select changes
  const actionSelect = document.getElementById('ruleAction');
  if (actionSelect) {
    actionSelect.addEventListener('change', updateActionUI);
  }

  const conditionSelect = document.getElementById('ruleCondition');
  if (conditionSelect) {
    conditionSelect.addEventListener('change', updateConditionUI);
  }
}

// Render the rules list
async function render() {
  const app = document.getElementById('app');
  if (!app) return;

  const rules = await storage.getAllRules();
  
  if (rules.length === 0) {
    app.innerHTML = `
      <div class="header">
        <h2>Automation Rules</h2>
        <button id="btn-create-rule" class="btn-primary">Create Rule</button>
      </div>
      <div class="empty">No automation rules yet</div>
    `;
    attachEventListeners();
    return;
  }

  let html = `
    <div class="header">
      <h2>Automation Rules</h2>
      <button id="btn-create-rule" class="btn-primary">Create Rule</button>
    </div>
    <div class="rules-list">
  `;

  rules.forEach(rule => {
    const actionDisplay = {
      'assign_issue': `Assign to: ${rule.actionParam}`,
      'add_label': `Add label: ${rule.actionParam}`,
      'create_subtask': `Create subtask: ${rule.actionParam}`
    };

    const triggerDisplay = {
      'issue_created': 'Issue Created',
      'issue_updated': 'Issue Updated'
    };

    const conditionDisplay = {
      'any': 'Any condition',
      'priority_critical': 'Priority = Critical',
      'priority_highest': 'Priority = Highest',
      'priority_high': 'Priority = High',
      'priority_medium': 'Priority = Medium',
      'priority_low': 'Priority = Low',
      'priority_lowest': 'Priority = Lowest',
      'priority_informational': 'Priority = Informational',
      'type_bug': 'Type = Bug',
      'type_task': 'Type = Task',
      'type_story': 'Type = Story',
      'type_subtask': 'Type = Sub-task',
      'status_open': 'Status = Open',
      'status_inprogress': 'Status = In Progress',
      'status_closed': 'Status = Closed'
    };

    html += `
      <div class="rule-card">
        <div class="rule-header">
          <h3>${rule.name}</h3>
          <label class="toggle">
            <input type="checkbox" data-toggle-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
            <span>${rule.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <div class="rule-details">
          <p><strong>Trigger:</strong> ${triggerDisplay[rule.trigger] || rule.trigger}</p>
          <p><strong>Condition:</strong> ${conditionDisplay[rule.condition] || rule.condition}</p>
          <p><strong>Action:</strong> ${actionDisplay[rule.action] || rule.action}</p>
        </div>
        <button class="btn-delete" data-delete-id="${rule.id}">Delete</button>
      </div>
    `;
  });

  html += `</div>`;
  app.innerHTML = html;
  attachEventListeners();
}

// Show create form
/* eslint-disable-next-line no-unused-vars */
function showCreateForm() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="header">
      <h2>Create Rule</h2>
    </div>
    <form class="form-container" id="createRuleForm">
      <div class="form-group">
        <label>Rule Name</label>
        <input type="text" id="ruleName" required placeholder="e.g., Auto-assign bug reports">
      </div>
      
      <div class="form-group">
        <label>When this happens (Trigger)</label>
        <select id="ruleEvent" required>
          <option value="">-- Select Event --</option>
          <option value="issue_created">Issue Created</option>
          <option value="issue_updated">Issue Updated</option>
        </select>
      </div>

      <div class="form-group">
        <label>If this condition is met</label>
        <select id="ruleCondition" required>
          <option value="">-- Select Condition --</option>
          <option value="any">Any event (no condition)</option>
          <optgroup label="Priority">
            <option value="priority_critical">Priority = Critical</option>
            <option value="priority_highest">Priority = Highest</option>
            <option value="priority_high">Priority = High</option>
            <option value="priority_medium">Priority = Medium</option>
            <option value="priority_low">Priority = Low</option>
            <option value="priority_lowest">Priority = Lowest</option>
            <option value="priority_informational">Priority = Informational</option>
          </optgroup>
          <optgroup label="Issue Type">
            <option value="type_bug">Issue type = Bug</option>
            <option value="type_task">Issue type = Task</option>
            <option value="type_story">Issue type = Story</option>
            <option value="type_subtask">Issue type = Sub-task</option>
          </optgroup>
          <optgroup label="Status">
            <option value="status_open">Status = Open</option>
            <option value="status_inprogress">Status = In Progress</option>
            <option value="status_closed">Status = Closed</option>
          </optgroup>
        </select>
      </div>

      <div class="form-group">
        <label>Do this action</label>
        <select id="ruleAction" required>
          <option value="">-- Select Action --</option>
          <option value="assign_issue">Assign Issue</option>
          <option value="add_label">Add Label</option>
          <option value="create_subtask">Create Subtask</option>
        </select>
      </div>

      <div id="actionParams"></div>

      <div class="form-actions">
        <button type="button" data-form-submit class="btn-primary">Create Rule</button>
        <button type="button" data-form-cancel class="btn-secondary">Cancel</button>
      </div>
    </form>
  `;
  attachEventListeners();
}

/* eslint-disable-next-line no-unused-vars */
function updateActionUI() {
  const action = document.getElementById('ruleAction').value;
  const paramsDiv = document.getElementById('actionParams');
  
  if (action === 'assign_issue') {
    paramsDiv.innerHTML = `
      <div class="form-group">
        <label>Assign to (User)</label>
        <input type="text" id="actionParam" placeholder="e.g., john.doe">
      </div>
    `;
  } else if (action === 'add_label') {
    paramsDiv.innerHTML = `
      <div class="form-group">
        <label>Label to add</label>
        <input type="text" id="actionParam" placeholder="e.g., bug-fix">
      </div>
    `;
  } else if (action === 'create_subtask') {
    paramsDiv.innerHTML = `
      <div class="form-group">
        <label>Subtask Summary</label>
        <input type="text" id="actionParam" placeholder="e.g., Fix this issue">
      </div>
    `;
  } else {
    paramsDiv.innerHTML = '';
  }
}

/* eslint-disable-next-line no-unused-vars */
function updateConditionUI() {
  // Conditions are straightforward, no extra UI needed
}

// Handle form submission
/* eslint-disable-next-line no-unused-vars */
async function handleCreateRule(event) {
  const name = document.getElementById('ruleName').value;
  const trigger = document.getElementById('ruleEvent').value;
  const condition = document.getElementById('ruleCondition').value;
  const action = document.getElementById('ruleAction').value;
  const actionParam = document.getElementById('actionParam')?.value || '';

  if (!name || !trigger || !condition || !action) {
    alert('Please fill in all fields');
    return;
  }

  if (!actionParam) {
    alert('Please enter the action parameter');
    return;
  }

  const newRule = {
    name: name,
    trigger: trigger,
    condition: condition,
    action: action,
    actionParam: actionParam,
    enabled: true
  };

  await storage.addRule(newRule);
  render();
}

// Toggle rule enabled state
/* eslint-disable-next-line no-unused-vars */
async function toggleRule(id) {
  await storage.toggleRule(id);
  render();
}

// Delete a rule
/* eslint-disable-next-line no-unused-vars */
async function deleteRule(id) {
  if (confirm('Delete this rule?')) {
    await storage.deleteRule(id);
    render();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
