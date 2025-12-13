/**
 * Debug script for course generation
 * Run with: node debug-course.js
 */

async function testCourseGeneration() {
  console.log('🔍 Testing Course Generation API...\n');
  
  // First test the simple test endpoint
  console.log('1. Testing simple Gemini connection...');
  try {
    const testResponse = await fetch('http://localhost:3000/api/course/test');
    const testData = await testResponse.json();
    
    if (testData.success) {
      console.log('✅ Gemini API is working!');
      console.log(`   Model: ${testData.model}`);
      console.log(`   Response: ${testData.response}\n`);
    } else {
      console.log('❌ Gemini API test failed');
      console.log(`   Error: ${testData.error}`);
      console.log(`   Tried models: ${testData.triedModels?.join(', ')}\n`);
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure npm run dev is running.');
    return;
  }

  // Now test course generation with a simple topic
  console.log('2. Testing course generation...');
  
  const courseRequest = {
    topic: 'Introduction to HTML',
    difficulty: 'beginner',
    duration: '1 week',
    includeVideos: false, // Skip videos to simplify
    videosPerTopic: 0
  };
  
  console.log('   Request:', JSON.stringify(courseRequest, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/course/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseRequest)
    });
    
    const responseText = await response.text();
    console.log('\n   Response status:', response.status);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('   Raw response (first 500 chars):', responseText.substring(0, 500));
      console.log('❌ Response is not valid JSON');
      return;
    }
    
    if (data.success) {
      console.log('✅ Course generated successfully!');
      console.log('\n   Course Title:', data.course?.title);
      console.log('   Modules:', data.course?.modules?.length);
      console.log('   Total Topics:', data.course?.modules?.reduce((acc, m) => acc + (m.topics?.length || 0), 0));
      
      // Show first module
      if (data.course?.modules?.[0]) {
        const firstModule = data.course.modules[0];
        console.log('\n   First Module:', firstModule.title);
        console.log('   Topics:');
        firstModule.topics?.slice(0, 3).forEach(topic => {
          console.log(`     - ${topic.title}`);
        });
      }
    } else {
      console.log('❌ Course generation failed');
      console.log('   Error:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Error calling course API:', error.message);
  }
}

// Run the test
console.log('========================================');
console.log('Course Generation Debug Script');
console.log('========================================\n');

console.log('Prerequisites:');
console.log('1. npm run dev is running');
console.log('2. GEMINI_API_KEY or GOOGLE_API_KEY is set in .env.local');
console.log('----------------------------------------\n');

testCourseGeneration().catch(console.error);
