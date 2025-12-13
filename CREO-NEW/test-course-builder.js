/**
 * Test script for Course Builder API
 * Run with: node test-course-builder.js
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`\n${colors.magenta}${colors.bright}🎓 Course Builder Test Script${colors.reset}\n`);

// Check prerequisites
console.log(`${colors.yellow}Prerequisites:${colors.reset}`);
console.log('1. Make sure your Next.js server is running (npm run dev)');
console.log('2. Ensure GEMINI_API_KEY is configured in .env.local');
console.log('3. Ensure YOUTUBE_API_KEY or GOOGLE_API_KEY is configured for video fetching\n');

// Test examples
const testCourses = [
  {
    name: 'Quick Test',
    data: {
      topic: 'JavaScript Basics',
      difficulty: 'beginner',
      duration: '2 weeks',
      includeVideos: true,
      videosPerTopic: 2
    }
  },
  {
    name: 'Intermediate Course',
    data: {
      topic: 'React Development',
      difficulty: 'intermediate',
      duration: '4 weeks',
      targetAudience: 'Web developers transitioning to React',
      prerequisites: ['JavaScript', 'HTML/CSS'],
      focusAreas: ['Hooks', 'State Management', 'Component Patterns'],
      includeVideos: true,
      videosPerTopic: 3
    }
  },
  {
    name: 'Advanced Course',
    data: {
      topic: 'Machine Learning with Python',
      difficulty: 'advanced',
      duration: '8 weeks',
      targetAudience: 'Data scientists and ML engineers',
      prerequisites: ['Python', 'Statistics', 'Linear Algebra'],
      focusAreas: ['Neural Networks', 'Deep Learning', 'Model Deployment'],
      includeVideos: true,
      videosPerTopic: 3
    }
  }
];

function displayCourseOptions() {
  console.log(`${colors.cyan}Choose a test course:${colors.reset}`);
  testCourses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.name} - ${course.data.topic}`);
  });
  console.log(`4. Custom course (enter your own topic)`);
  console.log(`5. Test API endpoint (GET request)`);
  console.log(`0. Exit`);
}

async function testApiEndpoint() {
  try {
    console.log(`\n${colors.yellow}Testing GET /api/course/generate...${colors.reset}`);
    
    const response = await fetch('http://localhost:3000/api/course/generate');
    const data = await response.json();
    
    if (data.success) {
      console.log(`${colors.green}✅ API endpoint is working!${colors.reset}`);
      console.log(`\n${colors.cyan}Endpoint Information:${colors.reset}`);
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`${colors.red}❌ API test failed${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error testing API:${colors.reset}`, error.message);
  }
}

async function generateCourse(courseData) {
  console.log(`\n${colors.yellow}Generating course...${colors.reset}`);
  console.log(`Topic: ${colors.cyan}${courseData.topic}${colors.reset}`);
  console.log(`Difficulty: ${courseData.difficulty || 'intermediate'}`);
  console.log(`Duration: ${courseData.duration || '4 weeks'}`);
  console.log(`Include Videos: ${courseData.includeVideos !== false ? 'Yes' : 'No'}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/course/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData)
    });
    
    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (data.success && data.course) {
      console.log(`\n${colors.green}✅ Course generated successfully in ${elapsed}s!${colors.reset}`);
      
      // Display course summary
      const course = data.course;
      console.log(`\n${colors.bright}📚 ${course.title}${colors.reset}`);
      console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`📝 ${course.description.substring(0, 150)}...`);
      console.log(`\n${colors.yellow}Course Structure:${colors.reset}`);
      console.log(`• Modules: ${course.modules.length}`);
      console.log(`• Total Topics: ${course.modules.reduce((acc, m) => acc + m.topics.length, 0)}`);
      console.log(`• Difficulty: ${course.difficulty}`);
      console.log(`• Duration: ${course.duration}`);
      
      if (data.videosFetched !== undefined) {
        console.log(`• Videos Fetched: ${data.videosFetched}`);
      }
      
      console.log(`\n${colors.yellow}Learning Outcomes:${colors.reset}`);
      course.learningOutcomes.slice(0, 3).forEach(outcome => {
        console.log(`  ✓ ${outcome}`);
      });
      
      console.log(`\n${colors.yellow}Modules:${colors.reset}`);
      course.modules.forEach((module, idx) => {
        console.log(`\n  ${colors.cyan}Module ${module.moduleNumber}: ${module.title}${colors.reset}`);
        console.log(`  ${module.description}`);
        console.log(`  Topics: ${module.topics.length} | Duration: ${module.estimatedDuration}`);
        
        // Show first 2 topics
        module.topics.slice(0, 2).forEach(topic => {
          console.log(`    • ${topic.title}`);
          if (topic.videos && topic.videos.length > 0) {
            console.log(`      📹 ${topic.videos.length} videos (top: ${topic.videos[0].title.substring(0, 40)}...)`);
          }
        });
        
        if (module.topics.length > 2) {
          console.log(`    ... and ${module.topics.length - 2} more topics`);
        }
      });
      
      // Option to save JSON
      rl.question(`\n${colors.blue}Save course JSON to file? (y/n): ${colors.reset}`, (answer) => {
        if (answer.toLowerCase() === 'y') {
          const filename = `course_${course.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
          require('fs').writeFileSync(filename, JSON.stringify(course, null, 2));
          console.log(`${colors.green}✅ Course saved to ${filename}${colors.reset}`);
        }
        
        askForNextAction();
      });
      
    } else {
      console.log(`\n${colors.red}❌ Failed to generate course${colors.reset}`);
      console.log(`Error: ${data.error || 'Unknown error'}`);
      askForNextAction();
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Make sure:${colors.reset}`);
    console.log('1. Your Next.js server is running on http://localhost:3000');
    console.log('2. Your API keys are properly configured');
    console.log('3. The YouTube Data API v3 is enabled in Google Cloud Console');
    askForNextAction();
  }
}

function askForNextAction() {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  displayCourseOptions();
  
  rl.question(`\n${colors.blue}Enter your choice (0-5): ${colors.reset}`, async (choice) => {
    const selected = parseInt(choice);
    
    if (selected === 0) {
      console.log(`\n${colors.green}Goodbye! Happy learning! 🎓${colors.reset}\n`);
      rl.close();
      process.exit(0);
    } else if (selected >= 1 && selected <= 3) {
      const course = testCourses[selected - 1];
      await generateCourse(course.data);
    } else if (selected === 4) {
      // Custom course
      rl.question(`${colors.blue}Enter course topic: ${colors.reset}`, (topic) => {
        if (!topic.trim()) {
          console.log(`${colors.red}Topic is required!${colors.reset}`);
          askForNextAction();
          return;
        }
        
        rl.question(`${colors.blue}Difficulty (beginner/intermediate/advanced): ${colors.reset}`, (difficulty) => {
          rl.question(`${colors.blue}Duration (e.g., 4 weeks): ${colors.reset}`, (duration) => {
            rl.question(`${colors.blue}Include videos? (y/n): ${colors.reset}`, async (includeVideos) => {
              await generateCourse({
                topic: topic.trim(),
                difficulty: difficulty || 'intermediate',
                duration: duration || '4 weeks',
                includeVideos: includeVideos.toLowerCase() !== 'n',
                videosPerTopic: 3
              });
            });
          });
        });
      });
    } else if (selected === 5) {
      await testApiEndpoint();
      askForNextAction();
    } else {
      console.log(`${colors.red}Invalid choice!${colors.reset}`);
      askForNextAction();
    }
  });
}

// Start the script
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
askForNextAction();

rl.on('close', () => {
  process.exit(0);
});
