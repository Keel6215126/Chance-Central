
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InteractiveBarChart } from '@/components/charts/bar-chart-interactive';
import type { ChartDataItem } from '@/lib/types';
import { useAdminMode } from '@/hooks/useAdminMode';
import { getRandomIntegers, checkRandomOrgConfigured } from '@/app/actions/randomnessActions';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CoinFlipExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();
  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<{ Heads: number; Tails: number }>({ Heads: 0, Tails: 0 });
  const [totalFlips, setTotalFlips] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<string>('');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  
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
        setUsingRandomOrg(false); // Assume not configured on error
      } finally {
        setRandomOrgStatusChecked(true);
      }
    }
    checkConfig();
  }, []);

  const chartData: ChartDataItem[] = useMemo(() => [
    { name: 'Heads', value: counts.Heads },
    { name: 'Tails', value: counts.Tails },
  ], [counts]);

  const handleFlipCoin = async () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setResult('...');

    let outcomeValue: number; // 0 for Heads, 1 for Tails

    if (isClient && isAdminMode && adminOverride && (adminOverride === "Heads" || adminOverride === "Tails")) {
      outcomeValue = adminOverride === "Heads" ? 0 : 1;
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 0, 1);
        outcomeValue = randomNumbers[0];
      } catch (error) { // This catch is for getRandomIntegers action's own error rethrow
        toast({
          variant: "destructive",
          title: "RNG Error",
          description: "Falling back to standard RNG. Check console for details.",
        });
        outcomeValue = Math.random() < 0.5 ? 0 : 1;
      }
    } else {
      outcomeValue = Math.random() < 0.5 ? 0 : 1;
    }

    const outcome = outcomeValue === 0 ? 'Heads' : 'Tails';

    let animCount = 0;
    const maxAnimCount = 8; // Number of quick changes before settling on result
    const animIntervalTime = 70; // milliseconds per change

    const animInterval = setInterval(() => {
      setResult(Math.random() < 0.5 ? 'H' : 'T'); // Visual flicker
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(outcome);
        setCounts(prevCounts => ({
          ...prevCounts,
          [outcome]: prevCounts[outcome as 'Heads' | 'Tails'] + 1,
        }));
        setTotalFlips(prevTotal => prevTotal + 1);
        setIsFlipping(false);
      }
    }, animIntervalTime);
  };
  
  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride('');
    }
  }, [isAdminMode]);

  return (
    <div className="space-y-6">
      <div className="control-group">
        <Button 
          onClick={handleFlipCoin} 
          disabled={isFlipping || !randomOrgStatusChecked}
          aria-busy={isFlipping}
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminCoinOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={setAdminOverride} disabled={isFlipping}>
              <SelectTrigger id="adminCoinOverride" className="w-[120px] h-9">
                <SelectValue placeholder="Random" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Random</SelectItem>
                <SelectItem value="Heads">Heads</SelectItem>
                <SelectItem value="Tails">Tails</SelectItem>
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

      <div className="result-display text-3xl" aria-live="polite">Coin: {result}</div>
      
      <InteractiveBarChart data={chartData} title="Flip Results" />
      
      <p className="stats-text">Total Flips: {totalFlips}</p>
    </div>
  );
}
