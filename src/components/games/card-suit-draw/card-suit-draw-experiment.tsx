
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InteractiveBarChart } from '@/components/charts/bar-chart-interactive';
import type { ChartDataItem } from '@/lib/types';
import { useAdminMode } from '@/hooks/useAdminMode';
import { getRandomIntegers, checkRandomOrgConfigured } from '@/app/actions/randomnessActions';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
type Suit = typeof SUITS[number];
const RANDOM_OPTION_VALUE = "__RANDOM_SUIT__";

export default function CardSuitDrawExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<Record<Suit, number>>({ Hearts: 0, Diamonds: 0, Clubs: 0, Spades: 0 });
  const [totalDraws, setTotalDraws] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<Suit | typeof RANDOM_OPTION_VALUE>(RANDOM_OPTION_VALUE);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const [usingRandomOrg, setUsingRandomOrg] = useState<boolean>(false);
  const [randomOrgStatusChecked, setRandomOrgStatusChecked] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    async function checkConfig() {
      try {
        const configured = await checkRandomOrgConfigured();
        setUsingRandomOrg(configured);
      } catch (error) {
        console.error("Error checking Random.org config:", error);
        setUsingRandomOrg(false);
      } finally {
        setRandomOrgStatusChecked(true);
      }
    }
    checkConfig();
  }, []);

  const chartData: ChartDataItem[] = useMemo(() => {
    return SUITS.map(suit => ({
      name: suit,
      value: counts[suit],
    }));
  }, [counts]);

  const handleDrawCard = useCallback(async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setResult('...');

    let drawnSuit: Suit;

    if (isClient && isAdminMode && adminOverride !== RANDOM_OPTION_VALUE) {
      drawnSuit = adminOverride as Suit; // Type assertion
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 0, SUITS.length - 1);
        drawnSuit = SUITS[randomNumbers[0]];
      } catch (error) {
        toast({
          variant: "destructive",
          title: "RNG Error",
          description: "Falling back to standard RNG. Check console for details.",
        });
        drawnSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
      }
    } else {
      drawnSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    }

    let animCount = 0;
    const maxAnimCount = 10;
    const animIntervalTime = 80;

    const animInterval = setInterval(() => {
      setResult(SUITS[Math.floor(Math.random() * SUITS.length)]);
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(drawnSuit);
        setCounts(prevCounts => ({
          ...prevCounts,
          [drawnSuit]: prevCounts[drawnSuit] + 1,
        }));
        setTotalDraws(prevTotal => prevTotal + 1);
        setIsDrawing(false);
      }
    }, animIntervalTime);

  }, [isDrawing, adminOverride, isAdminMode, usingRandomOrg, toast, randomOrgStatusChecked, isClient]);

  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride(RANDOM_OPTION_VALUE);
    }
  }, [isAdminMode]);

  return (
    <div className="space-y-6">
      <div className="control-group">
        <Button
          onClick={handleDrawCard}
          disabled={isDrawing || !randomOrgStatusChecked}
          aria-busy={isDrawing}
        >
          {isDrawing ? 'Drawing...' : 'Draw Card'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminCardSuitOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={(value: Suit | typeof RANDOM_OPTION_VALUE) => setAdminOverride(value)} disabled={isDrawing}>
              <SelectTrigger id="adminCardSuitOverride" className="w-[150px] h-9">
                <SelectValue placeholder="Random Suit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RANDOM_OPTION_VALUE}>Random Suit</SelectItem>
                {SUITS.map(suit => (
                  <SelectItem key={suit} value={suit}>{suit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {randomOrgStatusChecked && (
        <p className="info-text flex items-center justify-center text-xs">
          <Info className="w-3 h-3 mr-1" />
          {usingRandomOrg ? 'Using Random.org API for enhanced randomness.' : 'Using standard pseudo-random generator.'}
          {!usingRandomOrg && process.env.NODE_ENV === 'development' && !process.env.RANDOM_ORG_API_KEY &&
            <span className="ml-1"> (Set RANDOM_ORG_API_KEY in .env to enable)</span>
          }
        </p>
      )}

      <div className="result-display text-3xl" aria-live="polite">Suit: {result}</div>
      <InteractiveBarChart data={chartData} title="Suit Draw Results" />
      <p className="stats-text">Total Draws: {totalDraws}</p>
    </div>
  );
}
