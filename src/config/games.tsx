
import type { GameConfig } from '@/lib/types';
import {
  Dices,
  Coins,
  Shuffle,
  Spade,
  Target,
  Layers,
  Mail,
  ShoppingBag,
  Disc3,
  MessageSquare, // Icon for AI Chat
  ImageIcon, // Icon for AI Image Generator
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

// Define a new type that includes the icon as a ReactNode
export interface GameConfigWithIcon extends Omit<GameConfig, 'iconText'> {
  icon: ReactNode;
  iconComponent?: LucideIcon | (() => ReactNode); // Allow LucideIcon or a function returning ReactNode (for SVGs)
}

// Helper to create icons with consistent styling for Lucide icons
const createLucideIcon = (IconComponent: LucideIcon): ReactNode => {
  return <IconComponent size={36} strokeWidth={2} />;
};

// Inline SVG for Snake icon
const SnakeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 10a2 2 0 100-4 2 2 0 000 4z"/> 
    <path d="M12 10v4a2 2 0 002 2h0a2 2 0 002-2v-4a2 2 0 01-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2h2"/>
    <path d="M16 18a2 2 0 00-2-2h0"/>
  </svg>
);


export const games: GameConfigWithIcon[] = [
  {
    id: 'snake',
    slug: 'snake',
    name: 'Snake Game',
    description: 'Classic Snake game. Eat the food and grow longer!',
    icon: <SnakeIcon />,
    iconComponent: SnakeIcon,
    href: '/snake',
  },
  {
    id: 'dice-roll',
    slug: 'dice-roll',
    name: 'Dice Roll',
    description: 'Simulate rolling a standard 6-sided die and see frequency distributions.',
    icon: createLucideIcon(Dices),
    iconComponent: Dices,
    href: '/dice-roll',
  },
  {
    id: 'coin-flip',
    slug: 'coin-flip',
    name: 'Coin Flip',
    description: 'Simulate flipping a coin (Heads/Tails) and observe outcomes.',
    icon: createLucideIcon(Coins),
    iconComponent: Coins,
    href: '/coin-flip',
  },
  {
    id: 'rng-experiments',
    slug: 'rng-experiments',
    name: 'RNG Experiments',
    description: 'Explore Decimal, Integer, Normal, and Large Scale Random Number Generators.',
    icon: createLucideIcon(Shuffle),
    iconComponent: Shuffle,
    href: '/rng-experiments',
  },
  {
    id: 'ai-chat', 
    slug: 'ai-chat',
    name: 'AI Chat',
    description: 'Have a conversation with Keel, our friendly AI, powered by Gemini.',
    icon: createLucideIcon(MessageSquare),
    iconComponent: MessageSquare,
    href: '/ai-chat',
  },
  {
    id: 'ai-image-generator',
    slug: 'ai-image-generator',
    name: 'AI Image Generator',
    description: 'Generate images from text prompts using AI (Gemini 2.0).',
    icon: createLucideIcon(ImageIcon),
    iconComponent: ImageIcon,
    href: '/ai-image-generator',
  },
  {
    id: 'card-suit-draw',
    slug: 'card-suit-draw',
    name: 'Card Suit Draw',
    description: 'Draw a card and see its suit. Track the frequencies of Hearts, Diamonds, Clubs, Spades.',
    icon: createLucideIcon(Spade),
    iconComponent: Spade,
    href: '/card-suit-draw',
  },
  {
    id: 'specific-card-draw',
    slug: 'specific-card-draw',
    name: 'Specific Card Draw',
    description: 'Try to draw a specific target card from a full 52-card deck.',
    icon: createLucideIcon(Target),
    iconComponent: Target,
    href: '/specific-card-draw',
  },
  {
    id: 'red-black-card',
    slug: 'red-black-card',
    name: 'Red/Black Card',
    description: "Draw a card and determine if it's Red or Black.",
    icon: createLucideIcon(Layers),
    iconComponent: Layers,
    href: '/red-black-card',
  },
  {
    id: 'envelope-choice',
    slug: 'envelope-choice',
    name: 'Envelope Choice',
    description: 'A simplified probability puzzle. Pick an envelope, see if you win.',
    icon: createLucideIcon(Mail),
    iconComponent: Mail,
    href: '/envelope-choice',
  },
  {
    id: 'marbles',
    slug: 'marbles',
    name: 'Bag of Marbles',
    description: 'Draw marbles from a bag with a predefined mix of colors.',
    icon: createLucideIcon(ShoppingBag),
    iconComponent: ShoppingBag,
    href: '/marbles',
  },
  {
    id: 'roulette',
    slug: 'roulette',
    name: 'Roulette Wheel',
    description: 'Spin a European-style roulette wheel. Place bets on colors or numbers.',
    icon: createLucideIcon(Disc3),
    iconComponent: Disc3,
    href: '/roulette',
  },
];
