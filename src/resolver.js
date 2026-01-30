/**
 * Resolver for Custom UI routes and API invocations
 */


const Resolver = require('@forge/resolver').default;
const { ruleStorage } = require('./storage');
const resolver = new Resolver();

// Get all rules
resolver.define('getAllRules', async () => {
  return await ruleStorage.getAllRules();
});

// Create a new rule
resolver.define('createRule', async (req) => {
  const rule = req.payload.rule;
  return await ruleStorage.createRule(rule);
});

// Update a rule
resolver.define('updateRule', async (req) => {
  const { ruleId, updates } = req.payload;
  return await ruleStorage.updateRule(ruleId, updates);
});

// Delete a rule
resolver.define('deleteRule', async (req) => {
  const { ruleId } = req.payload;
  return await ruleStorage.deleteRule(ruleId);
});

// Toggle rule active/inactive
resolver.define('toggleRule', async (req) => {
  const { ruleId } = req.payload;
  return await ruleStorage.toggleRule(ruleId);
});

// Debug: Check what's in storage
resolver.define('debugStorage', async () => {
  console.log('[DEBUG] Checking Forge storage...');
  try {
    const rules = await storage.get('automation-rules');
    console.log('[DEBUG] automation-rules:', JSON.stringify(rules, null, 2));
    console.log('[DEBUG] Type:', typeof rules);
    console.log('[DEBUG] Is Array:', Array.isArray(rules));
    if (rules) {
      console.log('[DEBUG] Length:', rules.length);
      if (rules.length > 0) {
        console.log('[DEBUG] First rule:', JSON.stringify(rules[0], null, 2));
      }
    }
    return { 
      stored: !!rules,
      count: Array.isArray(rules) ? rules.length : 0,
      data: rules 
    };
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return { error: error.message };
  }
});

// Save rules to Forge storage
resolver.define('saveRules', async (req) => {
  console.log('saveRules invoked via resolver');
  const rules = req.payload.rules || [];
  
  try {
    // Save directly to Forge storage
    await storage.set('automation-rules', rules);
    console.log(`Saved ${rules.length} rules to Forge storage`);
    return { success: true, count: rules.length };
  } catch (error) {
    console.error('Error saving rules:', error);
    return { success: false, error: error.message };
  }
});

exports.handler = resolver.getDefinitions();
