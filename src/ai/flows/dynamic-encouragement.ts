'use server';
/**
 * @fileOverview Provides dynamic encouragement to roulette players based on their recent game history.
 *
 * - getRouletteEncouragement - A function that returns an encouragement message based on recent roulette game results.
 * - GetRouletteEncouragementInput - The input type for the getRouletteEncouragement function.
 * - GetRouletteEncouragementOutput - The return type for the getRouletteEncouragement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetRouletteEncouragementInputSchema = z.object({
  recentResults: z.array(z.boolean()).describe('An array of booleans representing recent roulette game results (true for win, false for loss).'),
});
export type GetRouletteEncouragementInput = z.infer<typeof GetRouletteEncouragementInputSchema>;

const GetRouletteEncouragementOutputSchema = z.object({
  shouldAdjust: z.boolean().describe('Whether the game should adjust the odds to allow a win.'),
  encouragementMessage: z.string().describe('An encouraging message to display to the user.'),
});
export type GetRouletteEncouragementOutput = z.infer<typeof GetRouletteEncouragementOutputSchema>;

export async function getRouletteEncouragement(input: GetRouletteEncouragementInput): Promise<GetRouletteEncouragementOutput> {
  return dynamicRouletteEncouragementFlow(input);
}

const analyzeRecentGames = ai.defineTool({
  name: 'analyzeRecentGames',
  description: 'Analyzes recent roulette game results to determine if the player needs encouragement or an adjustment to the game.',
  inputSchema: z.object({
    recentResults: z.array(z.boolean()).describe('An array of booleans representing recent roulette game results (true for win, false for loss).'),
  }),
  outputSchema: z.object({
    lossStreak: z.number().describe('The length of the current losing streak.'),
    needsEncouragement: z.boolean().describe('Whether the player needs encouragement based on their recent performance.'),
    shouldAdjustOdds: z.boolean().describe('If the odds should be adjusted'),
  }),
}, async (input) => {
  const {recentResults} = input;
  let lossStreak = 0;
  let needsEncouragement = false;
  let shouldAdjustOdds = false;

  for (let i = recentResults.length - 1; i >= 0; i--) {
    if (!recentResults[i]) {
      lossStreak++;
    } else {
      break;
    }
  }

  if (lossStreak >= 3) {
    needsEncouragement = true;
  }

  if (lossStreak >= 5) {
    shouldAdjustOdds = true;
  }

  return {
    lossStreak,
    needsEncouragement,
    shouldAdjustOdds,
  };
});

const prompt = ai.definePrompt({
  name: 'dynamicRouletteEncouragementPrompt',
  input: {schema: GetRouletteEncouragementInputSchema},
  output: {schema: GetRouletteEncouragementOutputSchema},
  tools: [analyzeRecentGames],
  prompt: `You are a helpful AI that provides encouragement to users playing a roulette game.

  Analyze the user's recent game results using the analyzeRecentGames tool. Based on the results, determine if the user needs encouragement or if the game should adjust the odds to allow them to win.

  If the user needs encouragement, provide a message that is both supportive and informative about the nature of probability.  The roulette wheel has no memory and eventually, wins will happen if the game is played enough times.

  If the user has had a long losing streak, set shouldAdjust to true to signal that the game should make it easier for them to win the next round.

  Return a JSON object with the shouldAdjust and encouragementMessage fields.
  `,
});

const dynamicRouletteEncouragementFlow = ai.defineFlow(
  {
    name: 'dynamicRouletteEncouragementFlow',
    inputSchema: GetRouletteEncouragementInputSchema,
    outputSchema: GetRouletteEncouragementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
