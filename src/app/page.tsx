
import { GameCard } from '@/components/game-card';
import { games } from '@/config/games.tsx';

export default function HomePage() {
  return (
    <div>
      <h1 className="page-title">Interactive Games & Simulators</h1>
      <div id="game-selection-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 py-5">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
