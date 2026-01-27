/**
 * Resolver for Custom UI routes and API invocations
 */

const Resolver = require('@forge/resolver');
const api = require('./api');

const resolver = new Resolver();

// Define API routes
resolver.define('getAllRules', async () => {
  console.log('getAllRules invoked via resolver');
  return await api.getAllRules();
});

resolver.define('saveRules', async (req) => {
  console.log('saveRules invoked via resolver');
  // Save rules to Forge storage for backend use
  const { ruleStorage } = require('./storage');
  const rules = req.payload.rules || [];
  
  try {
    // Clear existing rules first
    const existingRules = await ruleStorage.getAllRules();
    for (const rule of existingRules) {
      await ruleStorage.deleteRule(rule.ruleId);
    }
    
    // Convert frontend format to backend format and save
    for (const rule of rules) {
      let conditions = [];
      
      // Parse condition string (format: "field_value")
      if (rule.condition && rule.condition !== 'any') {
        const [field, value] = rule.condition.split('_');
        let backendField = field;
        let backendValue = value;
        
        // Map frontend field names to backend field names
        if (field === 'priority') {
          backendField = 'priority';
          // Capitalize the priority value
          backendValue = value.charAt(0).toUpperCase() + value.slice(1);
        } else if (field === 'type') {
          backendField = 'issueType';
          // Capitalize issue type
          backendValue = value.charAt(0).toUpperCase() + value.slice(1);
        } else if (field === 'status') {
          backendField = 'status';
          // Handle multi-word statuses
          if (value === 'inprogress') {
            backendValue = 'In Progress';
          } else {
            backendValue = value.charAt(0).toUpperCase() + value.slice(1);
          }
        }
        
        conditions.push({
          field: backendField,
          operator: 'equals',
          value: backendValue
        });
      }
      
      const backendRule = {
        ruleName: rule.name,
        enabled: rule.enabled,
        conditions: conditions.length > 0 ? conditions : [],
        actions: [
          {
            type: rule.action,
            params: {
              value: rule.actionParam
            }
          }
        ]
      };
      
      console.log('Saving rule to Forge storage:', backendRule);
      await ruleStorage.createRule(backendRule);
    }
    
    console.log(`Saved ${rules.length} rules to Forge storage`);
    return { success: true, count: rules.length };
  } catch (e) {
    console.error('Error saving rules:', e);
    return { success: false, error: e.message };
  }
});

resolver.define('getRule', async (req) => {
  console.log('getRule invoked via resolver:', req.payload);
  return await api.getRule(req.payload);
});

resolver.define('createRule', async (req) => {
  console.log('createRule invoked via resolver:', req.payload);
  return await api.createRule(req.payload);
});

resolver.define('updateRule', async (req) => {
  console.log('updateRule invoked via resolver:', req.payload);
  return await api.updateRule(req.payload);
});

resolver.define('deleteRule', async (req) => {
  console.log('deleteRule invoked via resolver:', req.payload);
  return await api.deleteRule(req.payload);
});

resolver.define('toggleRule', async (req) => {
  console.log('toggleRule invoked via resolver:', req.payload);
  return await api.toggleRule(req.payload);
});

exports.handler = resolver.getDefinitions();
