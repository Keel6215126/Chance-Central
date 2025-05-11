import type { GameConfig } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GameCardProps {
  game: GameConfig; // GameConfig now has 'icon' as ReactNode
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={game.href} legacyBehavior>
      <a className="block group">
        <Card className="h-full flex flex-col bg-[var(--container-bg)] border-[var(--border-color)] rounded-lg shadow-lg transition-all duration-200 ease-in-out hover:transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_0_15px_3px_var(--game-card-hover-shadow-color)] cursor-pointer">
          <CardHeader className="items-center pt-6">
            <div className="w-16 h-16 mb-4 bg-[var(--game-icon-bg)] rounded-lg flex items-center justify-center text-[var(--game-icon-text-color)] border border-[var(--border-color)] shadow-inner">
              {/* Render the icon ReactNode */}
              {game.icon}
            </div>
            <CardTitle className="text-[var(--h3-color)] text-xl font-medium">{game.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription className="text-sm text-[var(--foreground)] opacity-75 min-h-[3.6em]">
              {game.description}
            </CardDescription>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
