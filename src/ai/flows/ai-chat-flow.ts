
'use server';
/**
 * @fileOverview An AI chat flow.
 *
 * - aiChat - A function that handles user interaction with the AI.
 * - AIChatInput - The input type for the aiChat function.
 * - AIChatOutput - The return type for the aiChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIChatInputSchema = z.object({
  userInput: z.string().describe('The user query or question for the AI.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']).describe("The role of the message sender, either 'user' or 'model' (for AI)."),
    parts: z.array(z.object({text: z.string()})).describe("The content parts of the message.")
  })).optional().describe("Previous conversation history to maintain context.")
});
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI textual response to the user query.'),
});
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

export async function aiChat(input: AIChatInput): Promise<AIChatOutput> {
  return aiChatFlow(input);
}

const aiChatSystemPrompt = `You are a friendly and helpful AI chat companion. Your name is Keel. Users can chat with you about various topics. Keep your responses concise and engaging. If asked about your name, state it's Keel.`;

const chatPrompt = ai.definePrompt({
  name: 'aiGeneralChatPrompt', // Renamed for generality
  input: { schema: AIChatInputSchema },
  output: { schema: AIChatOutputSchema }, 
  system: aiChatSystemPrompt,
  prompt: (input) => input.userInput, 
  model: 'googleai/gemini-2.0-flash', 
  config: {
    temperature: 0.7,
    candidateCount: 1,
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  },
});

const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async (input: AIChatInput) => {
    const llmInput: AIChatInput = {
        userInput: input.userInput,
        ...(input.chatHistory && { chatHistory: input.chatHistory })
    };
    
    const { output } = await chatPrompt(llmInput);
    
    const aiTextResponse = output?.aiResponse ?? "I'm sorry, I couldn't generate a response at this moment.";
    return { aiResponse: aiTextResponse };
  }
);
