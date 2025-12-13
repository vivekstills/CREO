/**
 * Simple test script to verify Gemini API integration
 * Run with: node test-gemini.js
 */

const readline = require('readline');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`\n${colors.cyan}${colors.bright}🚀 Gemini API Test Script${colors.reset}\n`);

// Check if server is running
console.log(`${colors.yellow}Prerequisites:${colors.reset}`);
console.log('1. Make sure your Next.js server is running (npm run dev)');
console.log('2. Ensure you have set up your GEMINI_API_KEY in .env.local\n');

rl.question(`${colors.blue}Press Enter to test the API connection...${colors.reset}`, async () => {
  try {
    console.log(`\n${colors.yellow}Testing API connection...${colors.reset}`);
    
    // Test GET endpoint
    const testResponse = await fetch('http://localhost:3000/api/generate');
    const testData = await testResponse.json();
    let defaultModel = 'gemini-1.5-flash-latest';
    
    if (testData.success) {
      console.log(`${colors.green}✅ API endpoint is accessible!${colors.reset}`);
      if (Array.isArray(testData.data.supportedModels) && testData.data.supportedModels.length > 0) {
        console.log(`${colors.green}✅ Supported models:${colors.reset}`, testData.data.supportedModels.join(', '));
      }
      if (Array.isArray(testData.data.availableModels) && testData.data.availableModels.length > 0) {
        console.log(`${colors.green}✅ Available models:${colors.reset}`);
        testData.data.availableModels.forEach((model) => {
          if (typeof model === 'string') {
            console.log(`   - ${model}`);
          } else if (model && typeof model === 'object') {
            console.log(`   - ${model.displayName || model.name} (${model.name})`);
          }
        });
      }
      if (typeof testData.data.defaultModel === 'string') {
        defaultModel = testData.data.defaultModel.replace(/^models\//, '');
        console.log(`${colors.green}✅ Default model:${colors.reset} ${defaultModel}`);
      }
      
      if (testData.data.environmentVariables.configured) {
        console.log(`${colors.green}✅ API key is configured${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ API key is not configured. Please set GEMINI_API_KEY in .env.local${colors.reset}`);
        rl.close();
        return;
      }
    } else {
      console.log(`${colors.red}❌ API test failed${colors.reset}`);
      rl.close();
      return;
    }
    
    // Test POST endpoint with a simple prompt
    rl.question(`\n${colors.blue}Enter a test prompt (or press Enter for default): ${colors.reset}`, async (prompt) => {
      const testPrompt = prompt || "Say 'Hello World' in a creative way";
      
      console.log(`\n${colors.yellow}Sending test request...${colors.reset}`);
      console.log(`Prompt: "${testPrompt}"`);
      
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          model: defaultModel,
          maxTokens: 100,
          temperature: 0.7
        })
      });
      
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        
        if (data.success) {
          console.log(`\n${colors.green}✅ Success! Gemini responded:${colors.reset}`);
          console.log(`${colors.cyan}${data.data.response}${colors.reset}`);
          if (data.data.model) {
            console.log(`\n${colors.green}Model used: ${data.data.model}${colors.reset}`);
          }
        } else {
          console.log(`\n${colors.red}❌ Request failed:${colors.reset}`);
          console.log(data.error);
        }
      } catch (parseError) {
        console.log(`\n${colors.red}❌ Failed to parse response:${colors.reset}`);
        console.log(responseText);
      }
      
      console.log(`\n${colors.green}${colors.bright}Test complete! Your Gemini API integration is working.${colors.reset}`);
      console.log(`${colors.cyan}You can now use the web interface at http://localhost:3000${colors.reset}\n`);
      
      rl.close();
    });
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Make sure:${colors.reset}`);
    console.log('1. Your Next.js server is running on http://localhost:3000');
    console.log('2. You have installed all dependencies (npm install)');
    console.log('3. Your .env.local file exists with GEMINI_API_KEY set');
    rl.close();
  }
});

rl.on('close', () => {
  process.exit(0);
});
