/**
 * Main entry point for Jira Forge Workflow Automation Helper
 * Handles issue created and updated events
 */

const { ruleEngine } = require('./rule-engine');
const { ruleStorage } = require('./storage');

/**
 * Main handler for Jira issue events
 * @param {Object} event - The Jira event object
 */
exports.run = async function run(event) {
  console.log('=== EVENT TRIGGERED ===');
  console.log('Event type:', event.eventType);
  console.log('Issue:', event.issue.key);
  console.log('Issue Priority:', event.issue.fields.priority?.name);

  try {
    // Get all automation rules
    const rules = await ruleStorage.getAllRules();
    console.log(`[RULES] Total rules in storage: ${rules.length}`);
    console.log('[RULES] Rules:', JSON.stringify(rules, null, 2));
    
    const enabledRules = rules.filter(rule => rule.enabled === true);
    console.log(`[RULES] Enabled rules: ${enabledRules.length}`);

    if (enabledRules.length === 0) {
      console.log('[RULES] No enabled rules found - exiting');
      return;
    }

    // Get full issue details
    const issue = event.issue;
    
    // Evaluate each rule and execute actions if conditions match
    for (const rule of enabledRules) {
      try {
        console.log(`[RULE] Evaluating rule: "${rule.ruleName}"`);
        const shouldExecute = await ruleEngine.evaluateRule(rule, issue, event);
        
        if (shouldExecute) {
          console.log(`[RULE] ✓ Rule "${rule.ruleName}" conditions met. Executing actions...`);
          await ruleEngine.executeActions(rule.actions, issue);
          console.log(`[RULE] ✓ Actions executed successfully`);
        } else {
          console.log(`[RULE] ✗ Rule "${rule.ruleName}" conditions not met. Skipping.`);
        }
      } catch (error) {
        console.error(`[RULE] Error processing rule "${rule.ruleName}":`, error);
      }
    }
  } catch (error) {
    console.error('[ERROR] Workflow automation error:', error);
    throw error;
  }
};
