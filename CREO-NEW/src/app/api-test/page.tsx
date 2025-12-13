import ApiTester from '@/app/components/ApiTester';

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Gemini API Integration Tester
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Test the Gemini API integration with robust JSON parsing, error handling, and real-time response display.
          </p>
        </div>
        
        <ApiTester />
      </main>
    </div>
  );
}
