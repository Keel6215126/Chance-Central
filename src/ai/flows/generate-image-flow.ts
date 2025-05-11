
'use server';
/**
 * @fileOverview An AI flow for generating images from text prompts.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().nullable().describe('The data URI of the generated image, or null if generation failed.'),
  error: z.string().nullable().describe('An error message if image generation failed, otherwise null.')
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

// Note: ai.definePrompt is not strictly necessary here as we are directly calling ai.generate
// But if we wanted to add more complex prompting or tool use later, it would be useful.

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input: GenerateImageInput) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Must use this model for image generation
        prompt: input.prompt, // Simple text prompt
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
          // Optional: Adjust safety settings if needed, though defaults are usually fine
          // safetySettings: [
          //   { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          // ],
        },
      });

      if (media && media.url) {
        return { imageUrl: media.url, error: null };
      } else {
        // This case should ideally not be hit if responseModalities includes IMAGE and generation is successful
        console.warn('Image generation flow: No media URL in response despite successful generation attempt.');
        return { imageUrl: null, error: 'Image data not found in response.' };
      }
    } catch (error: any) {
      console.error('Error in generateImageFlow:', error);
      // Check for specific Genkit/Gemini error structures if available
      const errorMessage = error.message || 'An unexpected error occurred during image generation.';
      return { imageUrl: null, error: errorMessage };
    }
  }
);
