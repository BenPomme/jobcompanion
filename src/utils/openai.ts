import OpenAI from 'openai';

// Safe initialization for the OpenAI client
let openai: OpenAI;

// Only initialize on the server side
if (typeof window === 'undefined') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  // Create a dummy object for client-side to prevent errors
  // The actual API calls should only happen on the server
  openai = {
    chat: {
      completions: {
        create: () => {
          console.error('OpenAI API calls are only supported on the server side');
          return Promise.reject(new Error('OpenAI API calls are only supported on the server side'));
        }
      }
    }
  } as unknown as OpenAI;
}

export default openai;