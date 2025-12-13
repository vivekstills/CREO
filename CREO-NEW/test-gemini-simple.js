/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Simple Gemini API test
 * Run with: node test-gemini-simple.js
 */

const { callGeminiWithRetry } = require('./scripts/geminiRetry');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testGeminiDirectly() {
  console.log(`\n${colors.cyan}🔍 Testing Gemini API Directly${colors.reset}\n`);
  
  // Check for API key in environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.red}❌ No API key found in environment variables.${colors.reset}`);
    console.log(`Please set GEMINI_API_KEY or GOOGLE_API_KEY in your .env.local file\n`);
    return;
  }

  console.log(`${colors.green}✅ API key found${colors.reset}\n`);

  // Models to test - including latest 2.x versions
  const models = [
    'gemini-2.0-flash-exp',     // Latest 2.0 Flash
    'gemini-exp-1206',          // Latest experimental
    'gemini-1.5-flash-002',     // Latest stable Flash
    'gemini-1.5-flash',         // Standard Flash
    'gemini-1.5-pro-002',       // Latest stable Pro
    'gemini-1.5-pro'            // Standard Pro
  ];

  console.log(`Testing ${models.length} models...\n`);

  const payload = {
    contents: [
      {
        parts: [
          {
            text: 'Say "Hello World" in one sentence.'
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50
    }
  };

  for (const model of models) {
    process.stdout.write(`Testing ${model}... `);
    
    const { response, errorMessage, status } = await callGeminiWithRetry({
      apiKey,
      model,
      body: payload,
      maxRetries: 3
    });

    if (!response) {
      console.log(`${colors.red}❌ Failed${colors.reset}`);
      console.log(`   Error: ${errorMessage || status || 'Unknown error'}\n`);
      continue;
    }

    const data = await response.json();
    let responseText = 'No response';
    
    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        responseText = candidate.content.parts
          .map(part => part.text || '')
          .join('');
      }
    }
    
    console.log(`${colors.green}✅ Success${colors.reset}`);
    console.log(`   Response: ${responseText.substring(0, 50)}...\n`);
    
    // If we found a working model, return it
    console.log(`\n${colors.green}🎉 Found working model: ${model}${colors.reset}`);
    console.log(`You can use this model for course generation.\n`);
    return model;
  }
  
  console.log(`${colors.red}❌ No working models found${colors.reset}`);
  console.log(`Please check:`);
  console.log(`1. Your API key is valid`);
  console.log(`2. The Gemini API is enabled in Google Cloud Console`);
  console.log(`3. You have not exceeded your API quotas\n`);
}

// Also test through the local API
async function testLocalAPI() {
  console.log(`${colors.cyan}🔍 Testing Local API Endpoint${colors.reset}\n`);
  
  try {
    const response = await fetch('http://localhost:3000/api/course/test');
    const data = await response.json();
    
    if (data.success) {
      console.log(`${colors.green}✅ Local API is working!${colors.reset}`);
      console.log(`   Model: ${data.model}`);
      console.log(`   Response: ${data.response}\n`);
    } else {
      console.log(`${colors.red}❌ Local API test failed${colors.reset}`);
      console.log(`   Error: ${data.error}`);
      if (data.triedModels) {
        console.log(`   Tried models: ${data.triedModels.join(', ')}\n`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cannot connect to local server${colors.reset}`);
    console.log(`Make sure 'npm run dev' is running on port 3000\n`);
  }
}

// Run tests
async function runTests() {
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.cyan}Gemini API Test Script${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  
  // First test direct API
  await testGeminiDirectly();
  
  // Then test local endpoint
  await testLocalAPI();
  
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

runTests().catch(console.error);
