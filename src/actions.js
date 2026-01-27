/**
 * Action Handlers - Execute configured actions on Jira issues
 */

const api = require('@forge/api');

/**
 * Action handlers for different action types
 */
const actionHandlers = {
  /**
   * Execute an action based on its type
   * @param {Object} action - The action object
   * @param {Object} issue - The Jira issue object
   */
  async executeAction(action, issue) {
    const { type } = action;

    switch (type) {
      case 'addLabel':
        return await this.addLabel(issue.key, action.params.label);
      
      case 'createSubtask':
        return await this.createSubtask(issue.key, action.params);
      
      case 'reassign':
        return await this.reassignIssue(issue.key, action.params.assigneeAccountId);
      
      default:
        console.warn(`Unknown action type: ${type}`);
        throw new Error(`Unknown action type: ${type}`);
    }
  },

  /**
   * Add a label to an issue
   * @param {string} issueKey - The issue key
   * @param {string} label - The label to add
   */
  async addLabel(issueKey, label) {
    try {
      // Get current issue to check existing labels
      const issueResponse = await api.asApp().requestJira(api.route`/rest/api/3/issue/${issueKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const issue = await issueResponse.json();
      const currentLabels = issue.fields.labels || [];
      
      // Check if label already exists
      if (currentLabels.includes(label)) {
        console.log(`Label "${label}" already exists on ${issueKey}`);
        return;
      }
      
      // Add the new label
      const updatedLabels = [...currentLabels, label];
      
      await api.asApp().requestJira(api.route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            labels: updatedLabels
          }
        })
      });
      
      console.log(`Label "${label}" added to ${issueKey}`);
    } catch (error) {
      console.error(`Error adding label to ${issueKey}:`, error);
      throw error;
    }
  },

  /**
   * Create a subtask for an issue
   * @param {string} parentIssueKey - The parent issue key
   * @param {Object} params - Subtask parameters (summary, description, issueType, etc.)
   */
  async createSubtask(parentIssueKey, params) {
    try {
      // Get parent issue to get project key and issue type ID
      const parentResponse = await api.asApp().requestJira(api.route`/rest/api/3/issue/${parentIssueKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const parentIssue = await parentResponse.json();
      const projectKey = parentIssue.fields.project.key;
      
      // Get issue types for the project to find subtask type
      const issueTypesResponse = await api.asApp().requestJira(api.route`/rest/api/3/project/${projectKey}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const project = await issueTypesResponse.json();
      const subtaskType = project.issueTypes.find(type => type.subtask === true);
      
      if (!subtaskType) {
        throw new Error(`No subtask issue type found for project ${projectKey}`);
      }
      
      // Create subtask
      const subtaskData = {
        fields: {
          project: {
            key: projectKey
          },
          parent: {
            key: parentIssueKey
          },
          summary: params.summary || 'Subtask created by automation',
          description: params.description ? {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: params.description
                  }
                ]
              }
            ]
          } : undefined,
          issuetype: {
            id: subtaskType.id
          }
        }
      };
      
      // Remove undefined fields
      if (!subtaskData.fields.description) {
        delete subtaskData.fields.description;
      }
      
      const createResponse = await api.asApp().requestJira(api.route`/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subtaskData)
      });
      
      const createdSubtask = await createResponse.json();
      console.log(`Subtask ${createdSubtask.key} created for ${parentIssueKey}`);
      
      return createdSubtask;
    } catch (error) {
      console.error(`Error creating subtask for ${parentIssueKey}:`, error);
      throw error;
    }
  },

  /**
   * Reassign an issue to a user
   * @param {string} issueKey - The issue key
   * @param {string} assigneeAccountId - The account ID of the assignee
   */
  async reassignIssue(issueKey, assigneeAccountId) {
    try {
      await api.asApp().requestJira(api.route`/rest/api/3/issue/${issueKey}/assignee`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: assigneeAccountId
        })
      });
      
      console.log(`Issue ${issueKey} reassigned to ${assigneeAccountId}`);
    } catch (error) {
      console.error(`Error reassigning issue ${issueKey}:`, error);
      throw error;
    }
  }
};

module.exports = { actionHandlers };
