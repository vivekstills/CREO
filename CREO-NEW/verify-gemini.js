/**
 * Quick Gemini Model Verification
 * Run with: node verify-gemini.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

console.log('\n🔍 Verifying Gemini Models\n');
console.log('This will test which models work with your API.\n');

// Note: You need to have your API key in .env.local
console.log(`${colors.yellow}Make sure your server is running (npm run dev)${colors.reset}\n`);

async function verifyModels() {
  try {
    // Test through local API
    const response = await fetch('http://localhost:3000/api/course/test');
    const data = await response.json();
    
    if (data.success) {
      console.log(`${colors.green}✅ SUCCESS!${colors.reset}`);
      console.log(`Working model: ${colors.green}${data.model}${colors.reset}`);
      console.log(`\nYou can now generate courses using this model.\n`);
      
      console.log('To generate a course:');
      console.log('1. Go to http://localhost:3000/course');
      console.log('2. Enter any topic');
      console.log('3. Click "Generate Course"');
      console.log('\nThe system will automatically use the working model.\n');
    } else {
      console.log(`${colors.red}❌ No working models found${colors.reset}`);
      console.log(`Error: ${data.error}`);
      console.log(`\nTried models: ${data.triedModels?.join(', ')}\n`);
      
      console.log('Troubleshooting:');
      console.log('1. Check your GEMINI_API_KEY in .env.local');
      console.log('2. Verify the Gemini API is enabled in Google Cloud Console');
      console.log('3. Check API quotas\n');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cannot connect to server${colors.reset}`);
    console.log('Make sure npm run dev is running\n');
  }
}

verifyModels();
