
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

const MARBLE_TYPES = ["Red", "Blue", "Green"] as const;
type MarbleColor = typeof MARBLE_TYPES[number];
const RANDOM_OPTION_VALUE = "__RANDOM_MARBLE__";

const MARBLE_BAG_SETUP: Record<MarbleColor, number> = { Red: 5, Blue: 3, Green: 2 };
const MARBLE_BAG: MarbleColor[] = [];
(Object.keys(MARBLE_BAG_SETUP) as MarbleColor[]).forEach(color => {
  for (let i = 0; i < MARBLE_BAG_SETUP[color]; i++) {
    MARBLE_BAG.push(color);
  }
});

export default function MarblesExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<Record<MarbleColor, number>>({ Red: 0, Blue: 0, Green: 0 });
  const [totalDraws, setTotalDraws] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<MarbleColor | typeof RANDOM_OPTION_VALUE>(RANDOM_OPTION_VALUE);
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
    return MARBLE_TYPES.map(color => ({
      name: color,
      value: counts[color],
    }));
  }, [counts]);

  const handleDrawMarble = useCallback(async () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setResult('...Reaching in...');

    let drawnMarble: MarbleColor;

    if (isClient && isAdminMode && adminOverride !== RANDOM_OPTION_VALUE) {
      drawnMarble = adminOverride as MarbleColor;
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 0, MARBLE_BAG.length - 1);
        drawnMarble = MARBLE_BAG[randomNumbers[0]];
      } catch (error) {
        toast({
          variant: "destructive",
          title: "RNG Error",
          description: "Falling back to standard RNG. Check console for details.",
        });
        drawnMarble = MARBLE_BAG[Math.floor(Math.random() * MARBLE_BAG.length)];
      }
    } else {
      drawnMarble = MARBLE_BAG[Math.floor(Math.random() * MARBLE_BAG.length)];
    }

    let animCount = 0;
    const maxAnimCount = 12;
    const animIntervalTime = 85;

    const animInterval = setInterval(() => {
      setResult(`${MARBLE_BAG[Math.floor(Math.random() * MARBLE_BAG.length)]}?`);
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(drawnMarble);
        setCounts(prevCounts => ({
          ...prevCounts,
          [drawnMarble]: prevCounts[drawnMarble] + 1,
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

  const bagContentsString = MARBLE_TYPES.map(color => `${MARBLE_BAG_SETUP[color]} ${color}`).join(', ');

  return (
    <div className="space-y-6">
      <p className="info-text">Bag contains: {bagContentsString} (Total {MARBLE_BAG.length}).</p>
      <div className="control-group">
        <Button
          onClick={handleDrawMarble}
          disabled={isDrawing || !randomOrgStatusChecked}
          aria-busy={isDrawing}
        >
          {isDrawing ? 'Drawing...' : 'Draw Marble'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminMarbleOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={(value: MarbleColor | typeof RANDOM_OPTION_VALUE) => setAdminOverride(value)} disabled={isDrawing}>
              <SelectTrigger id="adminMarbleOverride" className="w-[150px] h-9">
                <SelectValue placeholder="Random Marble" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RANDOM_OPTION_VALUE}>Random Marble</SelectItem>
                {MARBLE_TYPES.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
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

      <div className="result-display text-3xl" aria-live="polite">Marble: {result}</div>
      <InteractiveBarChart data={chartData} title="Marble Draw Results" />
      <p className="stats-text">Total Draws: {totalDraws}</p>
    </div>
  );
}
