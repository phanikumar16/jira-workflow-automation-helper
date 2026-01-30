/**
 * Forge Storage API utilities for managing automation rules
 */

const { storage } = require('@forge/api');

const RULES_STORAGE_KEY = 'automation-rules';
const RULE_ID_COUNTER_KEY = 'rule-id-counter';

/**
 * Storage utilities for automation rules
 */
const ruleStorage = {
  /**
   * Get all automation rules
   * @returns {Promise<Array>} Array of all rules
   */
  async getAllRules() {
    try {
      console.log('Storage: Getting all rules from key:', RULES_STORAGE_KEY);
      const rules = await storage.get(RULES_STORAGE_KEY);
      console.log('Storage: Retrieved rules:', rules);
      const result = rules || [];
      console.log(`Storage: Returning ${result.length} rules`);
      return result;
    } catch (error) {
      console.error('Storage: Error fetching rules:', error);
      console.error('Storage: Error details:', error.message, error.stack);
      // Return empty array instead of throwing to prevent breaking the UI
      return [];
    }
  },

  /**
   * Get a specific rule by ID
   * @param {string} ruleId - The rule ID
   * @returns {Promise<Object|null>} The rule object or null if not found
   */
  async getRule(ruleId) {
    try {
      const rules = await this.getAllRules();
      return rules.find(rule => rule.ruleId === ruleId) || null;
    } catch (error) {
      console.error(`Error fetching rule ${ruleId}:`, error);
      return null;
    }
  },

  /**
   * Save a new rule
   * @param {Object} rule - The rule object (without ruleId)
   * @returns {Promise<Object>} The saved rule with generated ruleId
   */
  async createRule(rule) {
    try {
      const rules = await this.getAllRules();
      // Generate new rule ID
      let counter = await storage.get(RULE_ID_COUNTER_KEY) || 0;
      counter += 1;
      await storage.set(RULE_ID_COUNTER_KEY, counter);
      // Default active to true if not set
      const newRule = {
        ...rule,
        active: rule.active !== undefined ? rule.active : true,
        ruleId: `rule-${counter}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      rules.push(newRule);
      await storage.set(RULES_STORAGE_KEY, rules);
      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      throw error;
    }
  },

  /**
   * Update an existing rule
   * @param {string} ruleId - The rule ID
   * @param {Object} updates - The rule updates
   * @returns {Promise<Object>} The updated rule
   */
  async updateRule(ruleId, updates) {
    try {
      const rules = await this.getAllRules();
      const ruleIndex = rules.findIndex(rule => rule.ruleId === ruleId);
      if (ruleIndex === -1) {
        throw new Error(`Rule ${ruleId} not found`);
      }
      rules[ruleIndex] = {
        ...rules[ruleIndex],
        ...updates,
        ruleId, // Ensure ruleId is not overwritten
        updatedAt: new Date().toISOString()
      };
      await storage.set(RULES_STORAGE_KEY, rules);
      return rules[ruleIndex];
    } catch (error) {
      console.error(`Error updating rule ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a rule
   * @param {string} ruleId - The rule ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteRule(ruleId) {
    try {
      const rules = await this.getAllRules();
      const filteredRules = rules.filter(rule => rule.ruleId !== ruleId);
      
      if (filteredRules.length === rules.length) {
        return false; // Rule not found
      }
      
      await storage.set(RULES_STORAGE_KEY, filteredRules);
      return true;
    } catch (error) {
      console.error(`Error deleting rule ${ruleId}:`, error);
      throw error;
    }
  },

  /**
   * Toggle rule enabled status
   * @param {string} ruleId - The rule ID
   * @returns {Promise<Object>} The updated rule
   */
  async toggleRule(ruleId) {
    try {
      const rule = await this.getRule(ruleId);
      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }
      return await this.updateRule(ruleId, { active: !rule.active });
    } catch (error) {
      console.error(`Error toggling rule ${ruleId}:`, error);
      throw error;
    }
  }
};

module.exports = { ruleStorage };
