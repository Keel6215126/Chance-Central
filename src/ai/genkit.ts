import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Default model for text generation, conversation, etc.
// Image generation tools will specify 'googleai/gemini-2.0-flash-exp' directly.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash', 
});
