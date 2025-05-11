
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

const CARD_SUITS_FOR_DECK = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
type CardSuit = typeof CARD_SUITS_FOR_DECK[number];
const CARD_COLORS: Record<CardSuit, 'Red' | 'Black'> = {
  Hearts: "Red", Diamonds: "Red", Clubs: "Black", Spades: "Black"
};
type CardColor = 'Red' | 'Black';

export default function RedBlackCardExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<Record<CardColor, number>>({ Red: 0, Black: 0 });
  const [totalDraws, setTotalDraws] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<CardColor | ''>('');
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

  const chartData: ChartDataItem[] = useMemo(() => [
    { name: 'Red', value: counts.Red },
    { name: 'Black', value: counts.Black },
  ], [counts]);

  const handleDrawCard = useCallback(async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setResult('...');

    let drawnColor: CardColor;

    if (isClient && isAdminMode && adminOverride !== '') {
      drawnColor = adminOverride;
    } else {
      let randomSuit: CardSuit;
      if (usingRandomOrg) {
        try {
          const randomNumbers = await getRandomIntegers(1, 0, CARD_SUITS_FOR_DECK.length - 1);
          randomSuit = CARD_SUITS_FOR_DECK[randomNumbers[0]];
        } catch (error) {
          toast({
            variant: "destructive",
            title: "RNG Error",
            description: "Falling back to standard RNG. Check console for details.",
          });
          randomSuit = CARD_SUITS_FOR_DECK[Math.floor(Math.random() * CARD_SUITS_FOR_DECK.length)];
        }
      } else {
        randomSuit = CARD_SUITS_FOR_DECK[Math.floor(Math.random() * CARD_SUITS_FOR_DECK.length)];
      }
      drawnColor = CARD_COLORS[randomSuit];
    }

    let animCount = 0;
    const maxAnimCount = 10;
    const animIntervalTime = 80;

    const animInterval = setInterval(() => {
      setResult(Math.random() < 0.5 ? 'Red' : 'Black');
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(drawnColor);
        setCounts(prevCounts => ({
          ...prevCounts,
          [drawnColor]: prevCounts[drawnColor] + 1,
        }));
        setTotalDraws(prevTotal => prevTotal + 1);
        setIsDrawing(false);
      }
    }, animIntervalTime);

  }, [isDrawing, adminOverride, isAdminMode, usingRandomOrg, toast, randomOrgStatusChecked, isClient]);

  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride('');
    }
  }, [isAdminMode]);

  return (
    <div className="space-y-6">
      <p className="info-text">Draw a card. Is it Red or Black? (Hearts/Diamonds are Red, Clubs/Spades are Black)</p>
      <div className="control-group">
        <Button
          onClick={handleDrawCard}
          disabled={isDrawing || !randomOrgStatusChecked}
          aria-busy={isDrawing}
        >
          {isDrawing ? 'Drawing...' : 'Draw Red/Black'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminRedBlackOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={(value: CardColor | '') => setAdminOverride(value)} disabled={isDrawing}>
              <SelectTrigger id="adminRedBlackOverride" className="w-[150px] h-9">
                <SelectValue placeholder="Random Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Random</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Black">Black</SelectItem>
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

      <div className="result-display text-3xl" aria-live="polite">Color: {result}</div>
      <InteractiveBarChart data={chartData} title="Red/Black Draw Results" />
      <p className="stats-text">Total Draws: {totalDraws}</p>
    </div>
  );
}
