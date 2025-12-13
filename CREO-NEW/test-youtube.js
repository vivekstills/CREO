/**
 * Test YouTube API
 * Run with: YOUTUBE_API_KEY=AIzaSyDLaMnVtWIfpc4r9kEPZqHy98NgMmf4dsc node test-youtube.js
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testYouTubeAPI() {
  console.log(`\n${colors.cyan}🎥 Testing YouTube API${colors.reset}\n`);
  
  // Use the provided API key
  const apiKey = 'AIzaSyDLaMnVtWIfpc4r9kEPZqHy98NgMmf4dsc';
  
  console.log(`${colors.green}✅ Using YouTube API Key${colors.reset}\n`);
  
  // Test search
  const testQuery = 'JavaScript tutorial for beginners';
  console.log(`Searching for: "${testQuery}"\n`);
  
  try {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: testQuery,
      type: 'video',
      maxResults: '5',
      order: 'relevance',
      videoDuration: 'medium',
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`
    );
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`${colors.green}✅ YouTube API is working!${colors.reset}\n`);
      console.log(`Found ${data.items?.length || 0} videos:\n`);
      
      if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.snippet.title}`);
          console.log(`   Channel: ${item.snippet.channelTitle}`);
          console.log(`   URL: https://youtube.com/watch?v=${item.id.videoId}\n`);
        });
      }
      
      // Test video statistics
      if (data.items && data.items.length > 0) {
        console.log(`${colors.cyan}Testing video statistics...${colors.reset}\n`);
        
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        
        const statsParams = new URLSearchParams({
          part: 'statistics,contentDetails',
          id: videoIds,
          key: apiKey
        });
        
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
        );
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          
          console.log(`${colors.green}✅ Video statistics working!${colors.reset}\n`);
          
          if (statsData.items && statsData.items[0]) {
            const video = statsData.items[0];
            console.log(`Sample video stats:`);
            console.log(`  Views: ${parseInt(video.statistics.viewCount).toLocaleString()}`);
            console.log(`  Likes: ${parseInt(video.statistics.likeCount || 0).toLocaleString()}`);
            console.log(`  Duration: ${video.contentDetails.duration}\n`);
          }
        }
      }
      
      console.log(`${colors.green}🎉 YouTube API is fully functional!${colors.reset}`);
      console.log(`You can now generate courses with video content.\n`);
      
    } else {
      const error = await response.json();
      console.log(`${colors.red}❌ YouTube API Error${colors.reset}`);
      console.log(`Status: ${response.status}`);
      console.log(`Message: ${error.error?.message || 'Unknown error'}\n`);
      
      if (response.status === 403) {
        console.log(`${colors.yellow}Possible issues:${colors.reset}`);
        console.log(`1. YouTube Data API v3 not enabled in Google Cloud Console`);
        console.log(`2. API key restrictions blocking the request`);
        console.log(`3. Quota exceeded\n`);
      }
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Error testing YouTube API${colors.reset}`);
    console.log(error.message);
  }
}

// Run the test
console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.cyan}YouTube API Test${colors.reset}`);
console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);

testYouTubeAPI().catch(console.error);
