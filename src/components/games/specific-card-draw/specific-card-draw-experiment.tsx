
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

const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'] as const;
const CARD_SUITS_FOR_DECK = ['Hearts', 'Diamonds', 'Clubs', 'Spades'] as const;
const FULL_DECK: string[] = [];
CARD_SUITS_FOR_DECK.forEach(suit => {
  CARD_RANKS.forEach(rank => {
    FULL_DECK.push(`${rank} of ${suit}`);
  });
});

const TARGET_SPECIFIC_CARD = "Ace of Spades";
const RANDOM_OPTION_VALUE = "__RANDOM_CARD__";

export default function SpecificCardDrawExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<{ target: number; other: number }>({ target: 0, other: 0 });
  const [totalDraws, setTotalDraws] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<string>(RANDOM_OPTION_VALUE);
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
    { name: TARGET_SPECIFIC_CARD, value: counts.target },
    { name: 'Other Card', value: counts.other },
  ], [counts]);

  const handleDrawCard = useCallback(async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setResult('...Shuffling...');

    let drawnCard: string;

    if (isClient && isAdminMode && adminOverride !== RANDOM_OPTION_VALUE && FULL_DECK.includes(adminOverride)) {
      drawnCard = adminOverride;
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 0, FULL_DECK.length - 1);
        drawnCard = FULL_DECK[randomNumbers[0]];
      } catch (error) {
        toast({
          variant: "destructive",
          title: "RNG Error",
          description: "Falling back to standard RNG. Check console for details.",
        });
        drawnCard = FULL_DECK[Math.floor(Math.random() * FULL_DECK.length)];
      }
    } else {
      drawnCard = FULL_DECK[Math.floor(Math.random() * FULL_DECK.length)];
    }

    let animCount = 0;
    const maxAnimCount = 15;
    const animIntervalTime = 90;

    const animInterval = setInterval(() => {
      setResult(FULL_DECK[Math.floor(Math.random() * FULL_DECK.length)]);
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(drawnCard);
        setCounts(prevCounts => ({
          target: prevCounts.target + (drawnCard === TARGET_SPECIFIC_CARD ? 1 : 0),
          other: prevCounts.other + (drawnCard !== TARGET_SPECIFIC_CARD ? 1 : 0),
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
      <p className="info-text">Target Card: <strong>{TARGET_SPECIFIC_CARD}</strong> (1 out of 52)</p>
      <div className="control-group">
        <Button
          onClick={handleDrawCard}
          disabled={isDrawing || !randomOrgStatusChecked}
          aria-busy={isDrawing}
        >
          {isDrawing ? 'Drawing...' : 'Draw Specific Card'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminSpecificCardOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={(value: string) => setAdminOverride(value)} disabled={isDrawing}>
              <SelectTrigger id="adminSpecificCardOverride" className="w-[200px] h-9">
                <SelectValue placeholder="Random Card" />
              </SelectTrigger>
              <SelectContent className="max-h-60"> {/* Allow scrolling for many options */}
                <SelectItem value={RANDOM_OPTION_VALUE}>Random Card</SelectItem>
                {FULL_DECK.map(card => (
                  <SelectItem key={card} value={card}>{card}</SelectItem>
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

      <div className="result-display text-3xl" aria-live="polite">Card: {result}</div>
      <InteractiveBarChart data={chartData} title="Specific Card Draw Results" />
      <p className="stats-text">Total Draws: {totalDraws}</p>
    </div>
  );
}
