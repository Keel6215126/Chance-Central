
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

type Outcome = 'Win' | 'Lose';
const RANDOM_OPTION_VALUE = "__RANDOM_OUTCOME__";

export default function EnvelopeChoiceExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [result, setResult] = useState<string>('-');
  const [counts, setCounts] = useState<Record<Outcome, number>>({ Win: 0, Lose: 0 });
  const [totalChoices, setTotalChoices] = useState<number>(0);
  const [adminOverride, setAdminOverride] = useState<Outcome | typeof RANDOM_OPTION_VALUE>(RANDOM_OPTION_VALUE);
  const [isChoosing, setIsChoosing] = useState<boolean>(false);

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
    { name: 'Win', value: counts.Win },
    { name: 'Lose', value: counts.Lose },
  ], [counts]);

  const handleChooseEnvelope = useCallback(async () => {
    if (isChoosing) return;
    setIsChoosing(true);
    setResult('...Checking...');

    let outcome: Outcome;

    if (isClient && isAdminMode && adminOverride !== RANDOM_OPTION_VALUE) {
      outcome = adminOverride as Outcome;
    } else {
      let prizeLocation: number; // 0, 1, or 2
      if (usingRandomOrg) {
        try {
          const randomNumbers = await getRandomIntegers(1, 0, 2);
          prizeLocation = randomNumbers[0];
        } catch (error) {
          toast({
            variant: "destructive",
            title: "RNG Error",
            description: "Falling back to standard RNG. Check console for details.",
          });
          prizeLocation = Math.floor(Math.random() * 3);
        }
      } else {
        prizeLocation = Math.floor(Math.random() * 3);
      }
      // Simplified: Player always picks Envelope #1 (index 0)
      outcome = (prizeLocation === 0) ? "Win" : "Lose";
    }

    let animCount = 0;
    const maxAnimCount = 10;
    const animIntervalTime = 90;

    const animInterval = setInterval(() => {
      setResult(Math.random() < 0.5 ? 'Win?' : 'Lose?');
      animCount++;
      if (animCount >= maxAnimCount) {
        clearInterval(animInterval);
        setResult(`You ${outcome}!`);
        setCounts(prevCounts => ({
          ...prevCounts,
          [outcome]: prevCounts[outcome] + 1,
        }));
        setTotalChoices(prevTotal => prevTotal + 1);
        setIsChoosing(false);
      }
    }, animIntervalTime);

  }, [isChoosing, adminOverride, isAdminMode, usingRandomOrg, toast, randomOrgStatusChecked, isClient]);

  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride(RANDOM_OPTION_VALUE);
    }
  }, [isAdminMode]);

  return (
    <div className="space-y-6">
      <p className="info-text">There are 3 envelopes. One contains a prize. You pick Envelope #1. Did you win?</p>
      <div className="control-group">
        <Button
          onClick={handleChooseEnvelope}
          disabled={isChoosing || !randomOrgStatusChecked}
          aria-busy={isChoosing}
        >
          {isChoosing ? 'Choosing...' : 'Choose Envelope #1'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminEnvelopeOverride" className="text-sm">Admin:</Label>
            <Select value={adminOverride} onValueChange={(value: Outcome | typeof RANDOM_OPTION_VALUE) => setAdminOverride(value)} disabled={isChoosing}>
              <SelectTrigger id="adminEnvelopeOverride" className="w-[150px] h-9">
                <SelectValue placeholder="Random Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RANDOM_OPTION_VALUE}>Random Outcome</SelectItem>
                <SelectItem value="Win">Win</SelectItem>
                <SelectItem value="Lose">Lose</SelectItem>
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

      <div className="result-display text-3xl" aria-live="polite">Outcome: {result}</div>
      <InteractiveBarChart data={chartData} title="Envelope Choice Results" />
      <p className="stats-text">Total Choices: {totalChoices}</p>
    </div>
  );
}
