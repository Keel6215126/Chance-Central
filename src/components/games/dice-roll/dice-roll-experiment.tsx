
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InteractiveBarChart } from '@/components/charts/bar-chart-interactive';
import type { ChartDataItem } from '@/lib/types';
import { useAdminMode } from '@/hooks/useAdminMode';
import { getRandomIntegers, checkRandomOrgConfigured } from '@/app/actions/randomnessActions';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DiceRollExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<{ [key: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const [totalRolls, setTotalRolls] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<string>('');
  const [isRolling, setIsRolling] = useState<boolean>(false);

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
    return Object.entries(counts).map(([name, value]) => ({
      name: name,
      value: value,
    }));
  }, [counts]);

  const handleRollDice = useCallback(async () => {
    if (isRolling) return;
    setIsRolling(true);
    setResult('...');

    let roll: number;
    const adminOverrideValue = parseInt(adminOverride, 10);

    if (isClient && isAdminMode && !isNaN(adminOverrideValue) && adminOverrideValue >= 1 && adminOverrideValue <= 6) {
      roll = adminOverrideValue;
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 1, 6);
        roll = randomNumbers[0];
      } catch (error) {
        toast({
          variant: "destructive",
          title: "RNG Error",
          description: "Falling back to standard RNG. Check console for details.",
        });
        roll = Math.floor(Math.random() * 6) + 1;
      }
    } else {
      roll = Math.floor(Math.random() * 6) + 1;
    }

    let animCount = 0;
    const maxAnimCount = 8;
    const animIntervalTime = 70;

    const animInterval = setInterval(() => {
      setResult(`${Math.floor(Math.random() * 6) + 1}`);
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(`${roll}`);
        setCounts(prevCounts => ({
          ...prevCounts,
          [roll]: prevCounts[roll] + 1,
        }));
        setTotalRolls(prevTotal => prevTotal + 1);
        setIsRolling(false);
      }
    }, animIntervalTime);

  }, [isRolling, adminOverride, isAdminMode, usingRandomOrg, toast, randomOrgStatusChecked, isClient]);

  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride('');
    }
  }, [isAdminMode]);

  const handleAdminOverrideChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^[1-6]$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 6)) {
       setAdminOverride(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="control-group">
        <Button
          onClick={handleRollDice}
          disabled={isRolling || !randomOrgStatusChecked}
          aria-busy={isRolling}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminDiceOverride" className="text-sm">Admin:</Label>
            <Input
              type="number"
              id="adminDiceOverride"
              min="1"
              max="6"
              value={adminOverride}
              onChange={handleAdminOverrideChange}
              className="w-20 h-9"
              disabled={isRolling}
              placeholder="1-6"
            />
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

      <div className="result-display text-3xl" aria-live="polite">Dice: {result}</div>
      <InteractiveBarChart data={chartData} title="Roll Results" />
      <p className="stats-text">Total Rolls: {totalRolls}</p>
    </div>
  );
}
