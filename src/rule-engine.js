/**
 * Rule Engine - Evaluates conditions and executes actions
 */

const api = require('@forge/api');
const { actionHandlers } = require('./actions');

/**
 * Rule Engine for evaluating conditions and executing actions
 */
const ruleEngine = {
  /**
   * Evaluate if a rule's conditions are met
   * @param {Object} rule - The automation rule
   * @param {Object} issue - The Jira issue object
   * @param {Object} event - The Jira event object
   * @returns {Promise<boolean>} True if all conditions are met
   */
  async evaluateRule(rule, issue, event) {
    if (!rule.conditions || rule.conditions.length === 0) {
      console.log('Rule has no conditions, skipping');
      return false;
    }

    // Get full issue details from Jira API
    const fullIssue = await this.getIssueDetails(issue.key);
    
    // Evaluate all conditions (AND logic - all must be true)
    for (const condition of rule.conditions) {
      const conditionMet = await this.evaluateCondition(condition, fullIssue, event);
      
      if (!conditionMet) {
        return false; // One condition failed, rule doesn't match
      }
    }
    
    return true; // All conditions met
  },

  /**
   * Evaluate a single condition
   * @param {Object} condition - The condition object
   * @param {Object} issue - The full issue object
   * @param {Object} event - The Jira event object
   * @returns {Promise<boolean>} True if condition is met
   */
  async evaluateCondition(condition, issue, event) {
    const { field, operator, value } = condition;

    switch (field) {
      case 'issueType':
        return this.compareValue(issue.fields.issuetype.name, operator, value);
      
      case 'projectKey':
        return this.compareValue(issue.fields.project.key, operator, value);
      
      case 'status':
        return this.compareValue(issue.fields.status.name, operator, value);
      
      case 'priority':
        return this.compareValue(issue.fields.priority?.name || '', operator, value);
      
      case 'assignee': {
        const assigneeAccountId = issue.fields.assignee?.accountId || '';
        return this.compareValue(assigneeAccountId, operator, value);
      }
      
      case 'eventType':
        return this.compareValue(event.eventType, operator, value);
      
      default:
        console.warn(`Unknown condition field: ${field}`);
        return false;
    }
  },

  /**
   * Compare values based on operator
   * @param {string} actualValue - The actual value from the issue
   * @param {string} operator - The comparison operator
   * @param {string} expectedValue - The expected value
   * @returns {boolean} True if condition is met
   */
  compareValue(actualValue, operator, expectedValue) {
    const actual = String(actualValue || '').toLowerCase();
    const expected = String(expectedValue || '').toLowerCase();

    switch (operator) {
      case 'equals':
        return actual === expected;
      
      case 'notEquals':
        return actual !== expected;
      
      case 'contains':
        return actual.includes(expected);
      
      case 'notContains':
        return !actual.includes(expected);
      
      case 'startsWith':
        return actual.startsWith(expected);
      
      case 'endsWith':
        return actual.endsWith(expected);
      
      case 'isEmpty':
        return !actual || actual.trim() === '';
      
      case 'isNotEmpty':
        return actual && actual.trim() !== '';
      
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  },

  /**
   * Get full issue details from Jira API
   * @param {string} issueKey - The issue key (e.g., PROJ-123)
   * @returns {Promise<Object>} The full issue object
   */
  async getIssueDetails(issueKey) {
    try {
      const response = await api.asApp().requestJira(api.route`/rest/api/3/issue/${issueKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching issue ${issueKey}:`, error);
      throw error;
    }
  },

  /**
   * Execute all actions for a rule
   * @param {Array} actions - Array of action objects
   * @param {Object} issue - The Jira issue object
   */
  async executeActions(actions, issue) {
    if (!actions || actions.length === 0) {
      console.log('No actions to execute');
      return;
    }

    for (const action of actions) {
      try {
        await actionHandlers.executeAction(action, issue);
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        // Continue with other actions even if one fails
      }
    }
  }
};

module.exports = { ruleEngine };
