
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RouletteWheel } from './roulette-wheel';
import type { RoulettePocket } from '@/lib/types';
import { getRouletteEncouragement, type GetRouletteEncouragementOutput } from '@/ai/flows/dynamic-encouragement';
import { useToast } from "@/hooks/use-toast";
import { useAdminMode } from '@/hooks/useAdminMode';
import { getRandomIntegers, checkRandomOrgConfigured } from '@/app/actions/randomnessActions';
import { Info } from 'lucide-react';

// Changed to sequential wheel sequence
const SEQUENTIAL_WHEEL_SEQUENCE: number[] = Array.from({ length: 37 }, (_, i) => i); // 0, 1, 2, ..., 36

const getPocketColor = (number: number): 'red' | 'black' | 'purple' => {
  if (number === 0) return 'purple';
  // Strict alternation: odd numbers are red, even numbers are black
  return number % 2 !== 0 ? 'red' : 'black';
};

const ROULETTE_POCKETS_DATA: RoulettePocket[] = SEQUENTIAL_WHEEL_SEQUENCE.map((num, index) => ({
  number: num,
  color: getPocketColor(num),
  originalIndex: index, // This is the physical position on the wheel (0-36 clockwise)
}));

const POCKET_ANGLE_STEP = 360 / ROULETTE_POCKETS_DATA.length;

export default function RouletteExperiment() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();
  
  const [result, setResult] = useState<string>('-');
  const [totalSpins, setTotalSpins] = useState<number>(0);
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [bet, setBet] = useState<string>('none'); // Default bet to 'none'
  const [adminOverride, setAdminOverride] = useState<string>('');

  const [recentGameResults, setRecentGameResults] = useState<boolean[]>([]);
  const [aiAdjustmentNextSpin, setAiAdjustmentNextSpin] = useState<boolean>(false);

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

  const handleSpinRoulette = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(`Spinning... ${bet && bet !== "none" ? '(Bet: ' + bet.toUpperCase() + ')' : ''}`);

    let winningPocket: RoulettePocket;
    const adminOverrideValue = parseInt(adminOverride, 10); // Admin bets on a number
    let winningPocketOriginalIndex: number; 

    if (isClient && isAdminMode && !isNaN(adminOverrideValue) && SEQUENTIAL_WHEEL_SEQUENCE.includes(adminOverrideValue)) {
      // Find the pocket by its number to get its originalIndex for rotation
      const targetPocket = ROULETTE_POCKETS_DATA.find(p => p.number === adminOverrideValue);
      winningPocketOriginalIndex = targetPocket ? targetPocket.originalIndex : ROULETTE_POCKETS_DATA.find(p=>p.number === 0)!.originalIndex; // Fallback to 0 pocket's index
    } else if (aiAdjustmentNextSpin && bet && bet !== "none") {
      let potentialWinners = ROULETTE_POCKETS_DATA.filter(p => {
        if (bet === 'red' || bet === 'black' || bet === 'purple') return p.color === bet;
        if (!isNaN(parseInt(bet))) return p.number === parseInt(bet);
        return false;
      });
      if (potentialWinners.length > 0) {
         const chosenWinner = potentialWinners[Math.floor(Math.random() * potentialWinners.length)];
         winningPocketOriginalIndex = chosenWinner.originalIndex;
      } else { 
         winningPocketOriginalIndex = Math.floor(Math.random() * ROULETTE_POCKETS_DATA.length);
      }
      setAiAdjustmentNextSpin(false);
      toast({ title: "Friendly Spin!", description: "The odds felt a bit in your favor this time!" });
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 0, ROULETTE_POCKETS_DATA.length - 1);
        winningPocketOriginalIndex = randomNumbers[0]; 
      } catch (error) {
        toast({ variant: "destructive", title: "RNG Error", description: "Falling back to standard RNG." });
        winningPocketOriginalIndex = Math.floor(Math.random() * ROULETTE_POCKETS_DATA.length);
      }
    } else {
      // Weighted logic: Lower chance for player's bet to win
      let weightedPockets = [...ROULETTE_POCKETS_DATA]; // Start with a flat distribution

      if (bet && bet !== "none") {
        const betIsNumber = !isNaN(parseInt(bet));
        const betNumber = betIsNumber ? parseInt(bet) : null;
        const betColor = (bet === 'red' || bet === 'black' || bet === 'purple') ? bet : null;

        // Create a new array for weighted selection
        const tempWeightedPockets: RoulettePocket[] = [];
        ROULETTE_POCKETS_DATA.forEach(p => {
          let weight = 10; // Default weight for non-bet outcomes
          if (betNumber !== null && p.number === betNumber) {
            weight = 1; // Significantly lower weight if betting on this specific number
          } else if (betColor && p.color === betColor) {
            weight = 5; // Lower weight if betting on this color (but not as low as specific number)
          }
          for (let i = 0; i < weight; i++) {
            tempWeightedPockets.push(p);
          }
        });
        weightedPockets = tempWeightedPockets;
      }
      
      const tempWinningPocket = weightedPockets[Math.floor(Math.random() * weightedPockets.length)];
      winningPocketOriginalIndex = tempWinningPocket.originalIndex;
    }
    
    winningPocket = ROULETTE_POCKETS_DATA[winningPocketOriginalIndex];
    
    const targetRotation = -(winningPocket.originalIndex * POCKET_ANGLE_STEP); 
    const extraSpins = (Math.floor(Math.random() * 3) + 4) * 360; 
    
    const currentVisualRotation = currentRotation % 360;
    const targetVisualRotation = targetRotation % 360;

    let diff = targetVisualRotation - currentVisualRotation;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const finalRotation = currentRotation + extraSpins + diff;
    
    setCurrentRotation(finalRotation);

    setTimeout(() => {
      let playerWon = false;
      if (bet && bet !== "none") {
        if (bet === 'red' || bet === 'black' || bet === 'purple') {
          playerWon = winningPocket.color === bet;
        } else if (!isNaN(parseInt(bet))) {
          playerWon = winningPocket.number === parseInt(bet);
        }
      }
      
      setResult(`Landed ${winningPocket.number} (${winningPocket.color.toUpperCase()}). ${bet && bet !== "none" ? (playerWon ? 'You WON!' : 'You Lost.') : '(No bet placed)'}`);
      setTotalSpins(prev => prev + 1);
      setIsSpinning(false);
      
      if(bet && bet !== "none"){
        setRecentGameResults(prevResults => [...prevResults.slice(-9), playerWon]);
      }

    }, 5100); // Ensure this duration matches or slightly exceeds wheel animation
  }, [isSpinning, bet, adminOverride, isAdminMode, currentRotation, toast, aiAdjustmentNextSpin, usingRandomOrg, randomOrgStatusChecked, isClient]);

  useEffect(()   => {
    if (recentGameResults.length < 3 || !bet || bet === "none") return; 

    const lastFiveResultsWithBets = recentGameResults.slice(-5); 
    const lossesInLastFiveWithBets = lastFiveResultsWithBets.filter(r => !r).length;

    if (lossesInLastFiveWithBets >= 3 && !aiAdjustmentNextSpin) { 
      getRouletteEncouragement({ recentResults: lastFiveResultsWithBets })
        .then((encouragement: GetRouletteEncouragementOutput) => {
          if (encouragement.encouragementMessage) {
            toast({
              title: "A friendly note",
              description: encouragement.encouragementMessage,
              duration: 7000,
            });
          }
          if (encouragement.shouldAdjust) {
            setAiAdjustmentNextSpin(true);
          }
        })
        .catch(error => {
          console.error("Error getting roulette encouragement:", error);
          toast({
            variant: "destructive",
            title: "AI Error",
            description: "Could not get encouragement message.",
          });
        });
    }
  }, [recentGameResults, toast, bet, aiAdjustmentNextSpin]);
  
  useEffect(() => {
    if (!isAdminMode) {
      setAdminOverride('');
    }
  }, [isAdminMode]);

  const betOptions = useMemo(() => {
    const options = [
      { value: "none", label: "None" }, 
      { value: "red", label: "Red" },
      { value: "black", label: "Black" },
      { value: "purple", label: "Purple (0)" },
    ];
    const uniqueNumbers = Array.from(new Set(ROULETTE_POCKETS_DATA.map(p => p.number))).sort((a,b) => a - b);
    uniqueNumbers.forEach(num => {
       options.push({ value: num.toString(), label: `Number ${num}`});
    });
    return options;
  }, []);


  return (
    <div className="space-y-6 text-center">
      <div className="betting-area flex items-center justify-center space-x-2">
        <Label htmlFor="rouletteBetSelect">Bet on:</Label>
        <Select value={bet} onValueChange={setBet} disabled={isSpinning}>
          <SelectTrigger id="rouletteBetSelect" className="w-[180px]">
            <SelectValue placeholder="Select Bet" />
          </SelectTrigger>
          <SelectContent>
            {betOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.value === "none" && bet !== "none" /* Prevent selecting "None" if a bet is already active, allow clearing by other means or initial state */}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="control-group">
        <Button 
          onClick={handleSpinRoulette} 
          disabled={isSpinning || !randomOrgStatusChecked} 
          className="hover:shadow-[0_0_15px_3px_var(--game-card-hover-shadow-color)] transition-shadow duration-200"
        >
          {isSpinning ? 'Spinning...' : 'Spin Wheel'}
        </Button>
        {isClient && isAdminMode && (
          <div className="flex items-center space-x-2 ml-4">
            <Label htmlFor="adminRouletteOverride" className="text-sm">Admin Win #:</Label>
            <Input
              type="number"
              id="adminRouletteOverride"
              placeholder="0-36"
              min="0"
              max="36"
              value={adminOverride}
              onChange={(e) => {
                const val = e.target.value;
                 if (val === "" || (parseInt(val) >=0 && parseInt(val) <=36 && SEQUENTIAL_WHEEL_SEQUENCE.includes(parseInt(val)))) {
                    setAdminOverride(val);
                 }
              }}
              className="w-20 h-9"
              disabled={isSpinning}
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

      <div className="result-display text-xl" aria-live="polite">{result}</div>
      
      <RouletteWheel currentRotation={currentRotation} isSpinning={isSpinning} pockets={ROULETTE_POCKETS_DATA} />
      
      <p className="stats-text">Total Spins: {totalSpins}</p>
    </div>
  );
}

