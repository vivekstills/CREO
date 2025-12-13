# LearnLoop - Gemini API Integration Setup Guide

## Overview
This project provides a fully functional Google Gemini API integration with robust JSON parsing, error handling, and real-time response display.

## Features
- ✅ Complete Gemini API integration
- ✅ Robust JSON parsing with error recovery
- ✅ Detailed error handling and logging
- ✅ Support for current Gemini model IDs (1.5 Flash/Pro, Flash 8B, etc.) with required `-latest` suffixes
- ✅ Real-time response display
- ✅ Temperature and token controls
- ✅ API connection testing
- ✅ TypeScript type safety

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- A Google Gemini API key

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment Variables
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local and add your API key
GEMINI_API_KEY=your-actual-api-key-here
```

### 4. Run the Development Server
```bash
npm run dev
```

### 5. Open the Application
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Testing the Connection
1. Click the "Test API Connection" button
2. You should see a success message with available models (e.g. `gemini-2.0-pro-exp`, `gemini-1.5-pro-latest`)
3. The dropdown on the page updates automatically to show only the models your key can access

### Making API Calls
1. Enter your prompt in the text area
2. Select a Gemini model (v1beta model IDs include the `-latest` suffix). The list is refreshed from Google after you test the connection and may include:
   - **Gemini 2.0 Pro (Experimental)** (`gemini-2.0-pro-exp`): Highest quality, multimodal
   - **Gemini 2.0 Flash (Experimental)** (`gemini-2.0-flash-exp`): Fast multimodal responses
   - **Gemini 1.5 Pro** (`gemini-1.5-pro-latest`): Advanced text + reasonable vision
   - **Gemini 1.5 Flash** (`gemini-1.5-flash-latest`): Fast text/vision model
   - **Gemini 1.5 Flash 8B** (`gemini-1.5-flash-8b-latest`): Lightweight variant for lower latency
   - **Gemini 1.0 Pro** (`gemini-1.0-pro-latest`): Legacy model kept for backward compatibility

3. Adjust parameters:
   - **Max Tokens**: Maximum response length (1-8192)
   - **Temperature**: Response creativity (0-2, higher = more creative)

4. Click "Send Request" to generate a response

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # Gemini API endpoint
│   ├── components/
│   │   └── ApiTester.tsx       # Main UI component
│   ├── utils/
│   │   └── jsonHelpers.ts      # JSON parsing utilities
│   ├── page.tsx                # Home page
│   └── layout.tsx              # App layout
```

## API Endpoint

### POST /api/generate
Send requests to generate content using Gemini.

**Request Body:**
```json
{
  "prompt": "Your text prompt",
  "model": "gemini-1.5-flash-latest",    // optional
  "maxTokens": 2048,               // optional
  "temperature": 0.7               // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Generated text...",
    "model": "gemini-1.5-flash-latest",
    "usage": { ... },
    "safetyRatings": [ ... ]
  },
  "timestamp": "2024-11-08T..."
}
```

### GET /api/generate
Test the API connection and view configuration.

## Error Handling

The application handles various error scenarios:
- Invalid JSON format
- Missing API keys
- Network errors
- API rate limits
- Invalid responses

All errors are displayed with clear messages and debugging information.

## JSON Parsing Features

The `jsonHelpers.ts` utility provides:
- Safe JSON parsing with error recovery
- Automatic JSON repair for common issues
- JSON extraction from mixed content
- Response normalization
- Nested property access

## Troubleshooting

### API Key Not Working
- Ensure your API key is correctly set in `.env.local`
- Restart the development server after changing environment variables
- Check that your API key has the necessary permissions

### JSON Parse Errors
- The app automatically attempts to repair malformed JSON
- Check the console for detailed error messages
- Use the "Show Raw Response" button to inspect the actual API response

### Rate Limiting
- Gemini API has rate limits
- If you hit limits, wait a few minutes before trying again
- Consider using a different model or reducing request frequency

## Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secret
- Use environment variables for all sensitive data
- The `.gitignore` file is configured to exclude env files

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## Support

For issues or questions:
1. Check the browser console for error messages
2. Use the "Test API Connection" button to verify setup
3. Ensure all environment variables are correctly configured
4. Review the Gemini API documentation at https://ai.google.dev/

## License

This project is configured for educational and development purposes.
