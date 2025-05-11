import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--container-bg)] rounded-lg shadow-xl p-1 md:p-0">
      <div className="px-2 py-4 md:px-6 md:py-6">
        <Button asChild variant="outline" className="mb-6 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Games
          </Link>
        </Button>
        {children}
      </div>
    </div>
  );
}