/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Discover Available Gemini Models
 * Run with: node discover-models.js
 */

const { callGeminiWithRetry } = require('./scripts/geminiRetry');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function discoverModels() {
  console.log(`\n${colors.cyan}${colors.bright}🔍 Discovering Available Gemini Models${colors.reset}\n`);
  
  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.red}❌ No API key found. Please set GEMINI_API_KEY in your .env.local${colors.reset}\n`);
    return;
  }

  console.log(`${colors.green}✅ API key found${colors.reset}\n`);
  console.log('Testing various Gemini models...\n');

  // Comprehensive list of possible models including 2.x versions
  const modelsToTest = [
    // Latest experimental models
    { id: 'gemini-2.0-flash-exp', category: '2.0 Experimental' },
    { id: 'gemini-2.0-pro-exp', category: '2.0 Experimental' },
    { id: 'gemini-exp-1206', category: 'Latest Experimental' },
    { id: 'gemini-exp-1121', category: 'Recent Experimental' },
    { id: 'gemini-experimental', category: 'Generic Experimental' },
    
    // 1.5 Latest versions
    { id: 'gemini-1.5-flash-002', category: '1.5 Latest' },
    { id: 'gemini-1.5-pro-002', category: '1.5 Latest' },
    { id: 'gemini-1.5-flash-8b', category: '1.5 Variants' },
    
    // Standard 1.5 models
    { id: 'gemini-1.5-flash', category: '1.5 Standard' },
    { id: 'gemini-1.5-pro', category: '1.5 Standard' },
    
    // With -latest suffix
    { id: 'gemini-1.5-flash-latest', category: '1.5 Latest Suffix' },
    { id: 'gemini-1.5-pro-latest', category: '1.5 Latest Suffix' },
    
    // Legacy models
    { id: 'gemini-1.0-pro', category: 'Legacy' },
    { id: 'gemini-pro', category: 'Legacy' },
    { id: 'gemini-pro-vision', category: 'Legacy' }
  ];

  const workingModels = [];
  const failedModels = [];
  
  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'Return the number 42.'
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 10
    }
  };

  for (const model of modelsToTest) {
    process.stdout.write(`Testing ${colors.cyan}${model.id}${colors.reset} (${model.category})... `);
    
    const { response, errorMessage, status } = await callGeminiWithRetry({
      apiKey,
      model: model.id,
      body: payload,
      maxRetries: 3
    });

    if (response) {
      console.log(`${colors.green}✅ Working${colors.reset}`);
      workingModels.push(model);
    } else {
      if (errorMessage?.includes?.('not found')) {
        console.log(`${colors.yellow}⚠️  Not available${colors.reset}`);
      } else if (errorMessage?.includes?.('quota')) {
        console.log(`${colors.red}❌ Quota exceeded${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Failed (${status || 'error'})${colors.reset}`);
      }
      failedModels.push({ ...model, status: status || 'error', error: errorMessage });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}📊 Discovery Results${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  
  if (workingModels.length > 0) {
    console.log(`${colors.green}${colors.bright}✅ Working Models (${workingModels.length}):${colors.reset}\n`);
    
    // Group by category
    const byCategory = {};
    workingModels.forEach(model => {
      if (!byCategory[model.category]) byCategory[model.category] = [];
      byCategory[model.category].push(model.id);
    });
    
    Object.entries(byCategory).forEach(([category, models]) => {
      console.log(`  ${colors.yellow}${category}:${colors.reset}`);
      models.forEach(id => {
        console.log(`    • ${colors.green}${id}${colors.reset}`);
      });
      console.log();
    });
    
    // Recommendations
    console.log(`${colors.magenta}${colors.bright}🎯 Recommendations:${colors.reset}\n`);
    
    const has20Flash = workingModels.find(m => m.id === 'gemini-2.0-flash-exp');
    const hasExp1206 = workingModels.find(m => m.id === 'gemini-exp-1206');
    const has15Flash002 = workingModels.find(m => m.id === 'gemini-1.5-flash-002');
    
    if (has20Flash) {
      console.log(`  ${colors.green}Best for Speed:${colors.reset} gemini-2.0-flash-exp (Latest 2.0)`);
    } else if (hasExp1206) {
      console.log(`  ${colors.green}Best for Speed:${colors.reset} gemini-exp-1206 (Latest Experimental)`);
    } else if (has15Flash002) {
      console.log(`  ${colors.green}Best for Speed:${colors.reset} gemini-1.5-flash-002`);
    }
    
    const has15Pro002 = workingModels.find(m => m.id === 'gemini-1.5-pro-002');
    const has15Pro = workingModels.find(m => m.id === 'gemini-1.5-pro');
    
    if (has15Pro002) {
      console.log(`  ${colors.green}Best for Quality:${colors.reset} gemini-1.5-pro-002`);
    } else if (has15Pro) {
      console.log(`  ${colors.green}Best for Quality:${colors.reset} gemini-1.5-pro`);
    }
    
    console.log(`\n  ${colors.cyan}The course builder will automatically use the best available model.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ No working models found${colors.reset}\n`);
    console.log('Please check:');
    console.log('1. Your API key is valid');
    console.log('2. The Gemini API is enabled in Google Cloud');
    console.log('3. You have not exceeded quotas');
  }
  
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Run discovery
discoverModels().catch(console.error);
