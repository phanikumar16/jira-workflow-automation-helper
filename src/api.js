/**
 * API Functions - Exposed to Custom UI via Forge Bridge
 */

const { ruleStorage } = require('./storage');

/**
 * Get all automation rules
 */
async function getAllRules() {
  try {
    console.log('getAllRules API function called');
    const rules = await ruleStorage.getAllRules();
    console.log(`getAllRules returning ${rules?.length || 0} rules`);
    return rules;
  } catch (error) {
    console.error('Error in getAllRules API:', error);
    throw error;
  }
}

/**
 * Get a specific rule by ID
 */
async function getRule({ ruleId }) {
  return await ruleStorage.getRule(ruleId);
}

/**
 * Create a new rule
 */
async function createRule({ rule }) {
  return await ruleStorage.createRule(rule);
}

/**
 * Update an existing rule
 */
async function updateRule({ ruleId, updates }) {
  return await ruleStorage.updateRule(ruleId, updates);
}

/**
 * Delete a rule
 */
async function deleteRule({ ruleId }) {
  return await ruleStorage.deleteRule(ruleId);
}

/**
 * Toggle rule enabled status
 */
async function toggleRule({ ruleId }) {
  return await ruleStorage.toggleRule(ruleId);
}

module.exports = {
  getAllRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule
};
