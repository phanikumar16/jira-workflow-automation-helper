# Jira Workflow Automation Helper

A complete Jira Forge application that automatically performs actions on Jira issues when specific conditions are met, similar to Jira automation rules.

## Overview

This Forge app listens to Jira issue events (created/updated) and evaluates saved automation rules. When rule conditions are met, it automatically executes configured actions such as:
- Adding labels to issues
- Creating subtasks
- Reassigning issues to users

## Features

### Backend
- **Event Triggers**: Listens to `jira:issue_created` and `jira:issue_updated` events
- **Rule Engine**: Evaluates conditions using AND logic (all conditions must be met)
- **Action Handlers**: Executes actions on matching issues
- **Storage API**: Persists automation rules using Forge storage

### Frontend (Custom UI)
- **Rule Creation**: Create new automation rules with conditions and actions
- **Rule List**: View all rules with their status (enabled/disabled)
- **Rule Editor**: Edit existing rules
- **Rule Management**: Toggle rules on/off, delete rules

## Project Structure

```
jira-workflow/
├── manifest.yml                 # Forge app configuration
├── package.json                 # Node.js dependencies
├── src/
│   ├── index.js                # Main event handler
│   ├── api.js                  # API functions for Custom UI
│   ├── resolver.js             # Custom UI route resolver
│   ├── storage.js              # Forge storage utilities
│   ├── rule-engine.js          # Rule evaluation logic
│   ├── actions.js              # Action execution handlers
│   └── frontend/
│       ├── index.html          # Custom UI HTML entry point
│       ├── index.jsx           # React app entry point
│       └── components/
│           ├── RuleList.jsx    # Rule list view
│           ├── RuleCreator.jsx # Rule creation form
│           ├── RuleEditor.jsx  # Rule editing form
│           └── RuleForm.jsx    # Shared rule form component
├── examples/
│   ├── example-rule.json       # Example rule: auto-label bugs
│   ├── example-rule-reassign.json  # Example rule: auto-assign
│   └── example-rule-subtask.json   # Example rule: create subtask
└── README.md                   # This file
```

## Installation

1. **Install Forge CLI** (if not already installed):
   ```bash
   npm install -g @forge/cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update manifest.yml**:
   - Replace `your-app-id` in `manifest.yml` with your actual Forge app ID
   - Or let Forge generate it when you first deploy

4. **Deploy the app**:
   ```bash
   forge deploy
   ```

5. **Install the app in your Jira instance**:
   ```bash
   forge install
   ```

## Configuration

### Permissions

The app requires the following permissions (already configured in `manifest.yml`):
- `read:jira-work` - Read Jira issues and projects
- `write:jira-work` - Modify Jira issues (add labels, create subtasks, reassign)
- `storage:app` - Store automation rules

### Custom UI Access

The Custom UI is accessible via:
- Jira → Apps → Your App → Automation Rules

## Usage

### Creating a Rule

1. Navigate to the Custom UI in Jira
2. Click "Create Rule"
3. Fill in:
   - **Rule Name**: Descriptive name for the rule
   - **Project Key**: Optional - leave empty for all projects
   - **Enabled**: Toggle to enable/disable the rule
   - **Conditions**: Add one or more conditions (all must be met)
   - **Actions**: Add one or more actions to execute

### Supported Conditions

- **Issue Type**: Match issue type (e.g., "Bug", "Story")
- **Project Key**: Match project key (e.g., "PROJ")
- **Status**: Match issue status (e.g., "To Do", "In Progress")
- **Priority**: Match priority (e.g., "High", "Low")
- **Assignee**: Match assignee account ID
- **Event Type**: Match event type ("jira:issue_created" or "jira:issue_updated")

### Condition Operators

- `equals` - Exact match
- `notEquals` - Not equal
- `contains` - Contains substring
- `notContains` - Does not contain
- `startsWith` - Starts with
- `endsWith` - Ends with
- `isEmpty` - Field is empty
- `isNotEmpty` - Field is not empty

### Supported Actions

1. **Add Label**
   - Adds a label to the issue
   - Parameter: `label` (string)

2. **Create Subtask**
   - Creates a subtask under the issue
   - Parameters:
     - `summary` (string, required)
     - `description` (string, optional)

3. **Reassign Issue**
   - Reassigns the issue to a user
   - Parameter: `assigneeAccountId` (string, required)
   - Format: `557058:abc123def456` (Jira account ID)

### Example Rules

See the `examples/` directory for example rule configurations:
- `example-rule.json` - Auto-label high priority bugs
- `example-rule-reassign.json` - Auto-assign unassigned issues
- `example-rule-subtask.json` - Create review subtask for high priority issues

## Rule Schema

```json
{
  "ruleId": "rule-1",
  "ruleName": "Rule name",
  "projectKey": "PROJ",
  "enabled": true,
  "createdAt": "2026-01-26T10:00:00.000Z",
  "updatedAt": "2026-01-26T10:00:00.000Z",
  "conditions": [
    {
      "field": "issueType",
      "operator": "equals",
      "value": "Bug"
    }
  ],
  "actions": [
    {
      "type": "addLabel",
      "params": {
        "label": "urgent"
      }
    }
  ]
}
```

## Development

### Local Development

1. **Start tunnel for Custom UI**:
   ```bash
   forge tunnel
   ```

2. **View logs**:
   ```bash
   forge logs
   ```

### Testing

1. Create a test issue in Jira
2. Create a rule that matches the test issue
3. Update or create the issue to trigger the rule
4. Verify actions are executed

### Debugging

- Check Forge logs: `forge logs`
- Use `console.log()` statements in backend code
- Check browser console for frontend errors

## Best Practices

1. **Rule Naming**: Use descriptive names that explain what the rule does
2. **Conditions**: Start with specific conditions to avoid unintended matches
3. **Testing**: Test rules with disabled status first, then enable
4. **Performance**: Keep the number of enabled rules reasonable
5. **Error Handling**: The app continues processing other rules if one fails

## Limitations

- Conditions use AND logic only (all conditions must be met)
- Actions execute sequentially (one after another)
- Subtask creation requires the project to have a subtask issue type
- Reassign action requires a valid Jira account ID

## Troubleshooting

### Rules not executing
- Check if rule is enabled
- Verify conditions match the issue
- Check Forge logs for errors
- Ensure permissions are granted

### Actions failing
- Verify user has permissions to perform the action
- Check that required parameters are provided
- Ensure project has required issue types (for subtasks)

### Custom UI not loading
- Verify `forge tunnel` is running
- Check browser console for errors
- Ensure manifest.yml is properly configured

## Support

For issues or questions:
1. Check Forge logs: `forge logs`
2. Review Jira Forge documentation: https://developer.atlassian.com/platform/forge/
3. Check browser console for frontend errors

## License

This project is provided as-is for demonstration purposes.
