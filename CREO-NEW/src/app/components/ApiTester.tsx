'use client';

import { useEffect, useState } from 'react';

// TypeScript interfaces for type safety
interface ApiResponse {
  success: boolean;
  data?: {
    response: string;
    usage?: any;
    model?: string;
    raw?: any;
  };
  error?: string;
  timestamp: string;
}

interface FormData {
  prompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
}

type ModelOption = {
  value: string;
  label: string;
  description?: string;
};

const GEMINI_MODEL_OPTIONS: ModelOption[] = [
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Latest Experimental)' },
  { value: 'gemini-exp-1206', label: 'Gemini Experimental (Dec 2024)' },
  { value: 'gemini-exp-1121', label: 'Gemini Experimental (Nov 2024)' },
  { value: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash 002 (Latest Stable)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Standard)' },
  { value: 'gemini-1.5-pro-002', label: 'Gemini 1.5 Pro 002 (Latest Pro)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Standard Pro)' }
];

export default function ApiTester() {
  // State management
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(GEMINI_MODEL_OPTIONS);
  const [formData, setFormData] = useState<FormData>({
    prompt: '',
    maxTokens: 2048,
    temperature: 0.7,
    model: GEMINI_MODEL_OPTIONS[0].value
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  useEffect(() => {
    if (
      modelOptions.length > 0 &&
      !modelOptions.some(option => option.value === formData.model)
    ) {
      setFormData(prev => ({
        ...prev,
        model: modelOptions[0].value
      }));
    }
  }, [modelOptions, formData.model]);

  const syncModelOptionsFromApi = (apiPayload: any) => {
    if (!apiPayload || typeof apiPayload !== 'object') {
      return;
    }

    const availableModels = apiPayload?.data?.availableModels;
    const defaultModelFromApi = apiPayload?.data?.defaultModel;

    if (Array.isArray(availableModels) && availableModels.length > 0) {
      const formatted = availableModels
        .map((model: any): ModelOption | null => {
          if (typeof model === 'string') {
            const value = model.replace(/^models\//, '');
            return { value, label: value };
          }

          if (model && typeof model === 'object') {
            const name = typeof model.name === 'string' ? model.name.replace(/^models\//, '') : '';
            if (!name) {
              return null;
            }

            const label = typeof model.displayName === 'string' && model.displayName.length > 0
              ? model.displayName
              : name;

            return {
              value: name,
              label,
              description: typeof model.description === 'string' ? model.description : undefined
            };
          }

          return null;
        })
        .filter((option): option is ModelOption => option !== null);

      if (formatted.length > 0) {
        setModelOptions(formatted);

        const normalizedDefault = typeof defaultModelFromApi === 'string' && defaultModelFromApi.length > 0
          ? defaultModelFromApi.replace(/^models\//, '')
          : formatted[0].value;

        setFormData(prev => {
          if (formatted.some(option => option.value === prev.model)) {
            return prev;
          }

          if (prev.model === normalizedDefault) {
            return prev;
          }

          return {
            ...prev,
            model: normalizedDefault
          };
        });

        return;
      }
    }

    if (typeof defaultModelFromApi === 'string' && defaultModelFromApi.length > 0) {
      const normalizedDefault = defaultModelFromApi.replace(/^models\//, '');
      setFormData(prev => {
        if (prev.model === normalizedDefault) {
          return prev;
        }

        return {
          ...prev,
          model: normalizedDefault
        };
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous states
    setError(null);
    setResponse(null);
    setLoading(true);
    
    try {
      // Validate input
      if (!formData.prompt.trim()) {
        throw new Error('Please enter a prompt');
      }
      
      // Prepare request body
      const requestBody = {
        prompt: formData.prompt,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        model: formData.model
      };
      
      console.log('Sending request:', requestBody);
      
      // Make API call
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      // Get response text first
      const responseText = await res.text();
      console.log('Raw response:', responseText);
      
      // Try to parse JSON
      let data: ApiResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      syncModelOptionsFromApi(data);
      
      // Check if request was successful
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      
      // Set successful response
      setResponse(data);

      if (data.data?.model) {
        const normalizedModelUsed = data.data.model.replace(/^models\//, '');
        setFormData(prev => (prev.model === normalizedModelUsed ? prev : {
          ...prev,
          model: normalizedModelUsed
        }));
      }
      
    } catch (err) {
      console.error('API call error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Set error response
      setResponse({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };
  
  // Test API connection
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'GET'
      });
      
      const data = await res.json();
      setResponse(data);
      syncModelOptionsFromApi(data);
      
      if (!data.data?.environmentVariables?.configured) {
        setError('Warning: API key is not configured. Please set up your environment variables.');
      }
      
    } catch (err) {
      setError('Failed to test API connection');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
          Gemini API Integration Tester
        </h2>
        
        {/* Test Connection Button */}
        <div className="mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </button>
        </div>
        
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Prompt
            </label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              placeholder="Enter your prompt here..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100 min-h-[100px]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Gemini Model
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {modelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Click <span className="font-medium">Test API Connection</span> to refresh this list with the exact models your API key can access.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                id="maxTokens"
                name="maxTokens"
                value={formData.maxTokens}
                onChange={handleInputChange}
                min="1"
                max="8192"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Temperature
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                min="0"
                max="2"
                step="0.1"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Send Request'}
          </button>
        </form>
        
        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 font-medium">Error:</p>
            <p className="text-red-500 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}
        
        {/* Response Display */}
        {response && (
          <div className="mt-6 space-y-4">
            <div className={`p-4 rounded-md border ${
              response.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Response {response.success ? '✓' : '✗'}
                </h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {response.timestamp}
                </span>
              </div>
              
              {response.success && response.data ? (
                <div className="space-y-3">
                  {response.data.response && (
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Response:
                      </p>
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                          {response.data.response}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {response.data.usage && (
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Usage:
                      </p>
                      <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
                        {JSON.stringify(response.data.usage, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {response.data.model && (
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Model: {response.data.model}
                      </p>
                    </div>
                  )}
                  
                  {/* Toggle for raw response */}
                  {response.data.raw && (
                    <div>
                      <button
                        onClick={() => setShowRawResponse(!showRawResponse)}
                        className="text-sm text-blue-500 hover:text-blue-600 underline"
                      >
                        {showRawResponse ? 'Hide' : 'Show'} Raw Response
                      </button>
                      
                      {showRawResponse && (
                        <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
                          {JSON.stringify(response.data.raw, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ) : response.error ? (
                <p className="text-red-500 dark:text-red-300">{response.error}</p>
              ) : (
                <pre className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
          Gemini API Setup Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Get your Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">Google AI Studio</a></li>
          <li>Copy <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">env.example</code> to <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">.env.local</code></li>
          <li>Add your Gemini API key as <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">GEMINI_API_KEY=your-key-here</code></li>
          <li>Restart the development server with <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">npm run dev</code></li>
          <li>Click "Test API Connection" to verify your Gemini API setup</li>
          <li>Select a model and start generating content with Gemini!</li>
        </ol>
      </div>
    </div>
  );
}
