/**
 * Jira Workflow Automation Helper - Backend
 * Rule Evaluation and Action Execution Engine
 */

const { storage } = require('@forge/api');
const api = require('./api');

console.log('╔════════════════════════════════════════╗');
console.log('║  AUTOMATION MODULE LOADED              ║');
console.log('╚════════════════════════════════════════╝');

// ===== INFINITE LOOP PREVENTION =====

const AUTOMATION_USER_MARKER = 'automation-helper-v1';
let processedEvents = new Map(); // Track processed events

function isAutomationEvent(event) {
  // Check if event was triggered by this automation
  if (event.changelog && event.changelog.histories) {
    for (const history of event.changelog.histories) {
      if (history.author && history.author.name && 
          history.author.name.includes(AUTOMATION_USER_MARKER)) {
        return true;
      }
    }
  }
  return false;
}

function getEventFingerprint(event) {
  // Create unique ID for this event to prevent processing same event twice
  return `${event.issue.key}-${event.eventType}-${event.timestamp}`;
}

// ===== CONDITION EVALUATION =====

const ConditionEvaluator = {
  evaluate: async function(conditions, issue, event) {
    if (!conditions || conditions.length === 0) return true; // No conditions = always true
    
    // AND logic: all conditions must be true
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, issue, event);
      if (!result) {
        console.log(`[CONDITION] Failed: ${condition.field} ${condition.operator} ${condition.value}`);
        return false;
      }
    }
    
    return true;
  },
  
  evaluateCondition: async function(condition, issue, event) {
    const { field, operator, value } = condition;
    
    let fieldValue;
    
    switch (field) {
      case 'issueType':
        fieldValue = issue.fields.issuetype.name;
        break;
      case 'priority':
        fieldValue = issue.fields.priority?.name;
        break;
      case 'status':
        fieldValue = issue.fields.status?.name;
        break;
      case 'projectKey':
        fieldValue = issue.fields.project?.key;
        break;
      case 'assignee':
        fieldValue = issue.fields.assignee;
        break;
      case 'labels':
        fieldValue = issue.fields.labels || [];
        break;
      default:
        return false;
    }
    
    // Evaluate based on operator
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      
      case 'in':
        // Priority in list
        return value.split(',').map(v => v.trim()).includes(fieldValue);
      
      case 'isEmpty':
        return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
      
      case 'isNotEmpty':
        return fieldValue && (Array.isArray(fieldValue) ? fieldValue.length > 0 : true);
      
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return fieldValue?.includes(value);
      
      case 'notContains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(value);
        }
        return !fieldValue?.includes(value);
      
      default:
        return false;
    }
  }
};

// ===== ACTION EXECUTION =====

const ActionExecutor = {
  execute: async function(actions, issue) {
    if (!actions || actions.length === 0) return;
    
    for (const action of actions) {
      try {
        console.log(`[ACTION] Executing: ${action.type}`);
        
        switch (action.type) {
          case 'addLabel':
            await this.addLabel(issue, action.params.label);
            break;
          
          case 'createSubtask':
            await this.createSubtask(issue, action.params);
            break;
          
          case 'assignIssue':
            await this.assignIssue(issue, action.params.assignee);
            break;
          
          case 'updateField':
            await this.updateField(issue, action.params);
            break;
          
          default:
            console.warn(`[ACTION] Unknown action type: ${action.type}`);
        }
        
        console.log(`[ACTION] ✓ Executed: ${action.type}`);
      } catch (error) {
        console.error(`[ACTION] ✗ Failed to execute ${action.type}:`, error);
      }
    }
  },
  
  addLabel: async function(issue, label) {
    if (!label) return;
    
    const currentLabels = issue.fields.labels || [];
    
    // Avoid duplicates
    if (currentLabels.includes(label)) {
      console.log(`[ACTION] Label "${label}" already exists`);
      return;
    }
    
    const newLabels = [...currentLabels, label];
    
    await api.updateIssue(issue.key, {
      labels: newLabels
    });
    
    console.log(`[ACTION] Added label: "${label}"`);
  },
  
  createSubtask: async function(issue, params) {
    let { summary, description } = params;
    // Auto-generate summary if not provided
    if (!summary) {
      summary = `Auto-generated subtask for ${issue.key}`;
    }
    
    // Check if subtask with same summary already exists
    const existingSubtasks = issue.fields.subtasks || [];
    if (existingSubtasks.some(st => st.fields.summary === summary)) {
      console.log(`[ACTION] Subtask "${summary}" already exists`);
      return;
    }
    
    const subtaskPayload = {
      fields: {
        project: { key: issue.fields.project.key },
        parent: { key: issue.key },
        summary: summary,
        issuetype: { name: 'Sub-task' }
      }
    };
    
    if (description) {
      subtaskPayload.fields.description = description;
    }
    
    const response = await api.createIssue(subtaskPayload);
    console.log(`[ACTION] Created subtask: ${response.key}`);
  },
  
  assignIssue: async function(issue, assignee) {
    if (!assignee) return;
    
    // Check if already assigned to this person
    if (issue.fields.assignee?.emailAddress === assignee) {
      console.log(`[ACTION] Already assigned to ${assignee}`);
      return;
    }
    
    await api.updateIssue(issue.key, {
      assignee: { name: assignee }
    });
    
    console.log(`[ACTION] Assigned issue to: ${assignee}`);
  },
  
  updateField: async function(issue, params) {
    const { fieldKey, value } = params;
    
    if (!fieldKey || !value) {
      throw new Error('Field key and value are required');
    }
    
    const payload = {};
    payload[fieldKey] = value;
    
    await api.updateIssue(issue.key, payload);
    console.log(`[ACTION] Updated field ${fieldKey} to ${value}`);
  }
};

// ===== MAIN EVENT HANDLER =====

exports.run = async function run(event) {
  console.log('[DEBUG] Trigger function called. Event:', JSON.stringify(event, null, 2));
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  AUTOMATION TRIGGERED                  ║');
  console.log('╚════════════════════════════════════════╝');
  
  console.log(`[EVENT] Type: ${event.eventType}`);
  console.log(`[EVENT] Issue: ${event.issue.key}`);
  console.log(`[EVENT] Priority: ${event.issue.fields.priority?.name}`);
  console.log(`[EVENT] Status: ${event.issue.fields.status?.name}`);
  
  // Infinite loop prevention
  if (isAutomationEvent(event)) {
    console.log('[EVENT] ⚠ Skipping: Event caused by automation');
    return;
  }
  
  const fingerprint = getEventFingerprint(event);
  if (processedEvents.has(fingerprint)) {
    console.log('[EVENT] ⚠ Skipping: Event already processed');
    return;
  }
  processedEvents.set(fingerprint, true);
  
  // Cleanup old events
  if (processedEvents.size > 1000) {
    processedEvents.clear();
  }
  
  try {
    // Get all rules
    const rules = await storage.get('automation-rules') || [];
    console.log(`[STORAGE] Retrieved from Forge storage`);
    console.log(`[STORAGE] Raw value:`, rules);
    console.log(`[RULES] Total rules: ${rules.length}`);
    console.log(`[RULES] Rules:`, JSON.stringify(rules, null, 2));
    
    const activeRules = rules.filter(r => r.active !== false);
    console.log(`[RULES] Active rules: ${activeRules.length}`);
    if (activeRules.length === 0) {
      console.log('[RULES] No active rules found');
      return;
    }
    // Evaluate and execute each rule
    for (const rule of activeRules) {
      console.log(`\n[RULE] Checking: "${rule.name}"`);
      console.log(`[RULE] Trigger: ${rule.trigger}`);
      // Check if trigger matches
      const triggerMatches = 
        rule.trigger === 'both' ||
        (rule.trigger === 'created' && event.eventType === 'issue_created') ||
        (rule.trigger === 'updated' && event.eventType === 'issue_updated');
      if (!triggerMatches) {
        console.log(`[RULE] ✗ Trigger doesn't match`);
        continue;
      }
      // Evaluate conditions
      const conditionsMet = await ConditionEvaluator.evaluate(
        rule.conditions,
        event.issue,
        event
      );
      if (!conditionsMet) {
        console.log(`[RULE] ✗ Conditions not met`);
        continue;
      }
      console.log(`[RULE] ✓ Conditions met! Executing actions...`);
      // Execute actions
      await ActionExecutor.execute(rule.actions, event.issue);
      console.log(`[RULE] ✓ Rule completed successfully`);
    }
    
  } catch (error) {
    console.error('[ERROR] Automation execution failed:', error);
    console.error('[ERROR] Stack:', error.stack);
  }
  
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  AUTOMATION COMPLETED                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
};
