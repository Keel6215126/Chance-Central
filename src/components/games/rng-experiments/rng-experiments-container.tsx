
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InteractiveBarChart } from '@/components/charts/bar-chart-interactive';
import type { ChartDataItem } from '@/lib/types';
import { useAdminMode } from '@/hooks/useAdminMode';
import { getRandomIntegers, getRandomDecimalFractions, checkRandomOrgConfigured } from '@/app/actions/randomnessActions';
import { Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Decimal RNG ---
const NUM_DECIMAL_RNG_BINS = 10;
const decimalRngLabels = Array.from({ length: NUM_DECIMAL_RNG_BINS }, (_, i) => `${(i / NUM_DECIMAL_RNG_BINS).toFixed(1)}-${((i + 1) / NUM_DECIMAL_RNG_BINS).toFixed(1)}`);

// --- Integer RNG ---
const NUM_INTEGER_RNG_BINS = 10; // Bins of 10 numbers each (1-10, 11-20, ..., 91-100)
const integerRngLabels = Array.from({ length: NUM_INTEGER_RNG_BINS }, (_, i) => `${i * 10 + 1}-${(i + 1) * 10}`);

// --- Normal RNG ---
const normalRngBinRanges = [
  { min: -Infinity, max: -2.5, label: "< -2.5σ" },
  { min: -2.5, max: -1.5, label: "-2.5to-1.5σ" },
  { min: -1.5, max: -0.5, label: "-1.5to-0.5σ" },
  { min: -0.5, max: 0.5, label: "-0.5to0.5σ" },
  { min: 0.5, max: 1.5, label: "0.5to1.5σ" },
  { min: 1.5, max: 2.5, label: "1.5to2.5σ" },
  { min: 2.5, max: Infinity, label: "> 2.5σ" }
];
const normalRngLabels = normalRngBinRanges.map(r => r.label);

// --- Large Scale RNG ---
const LARGE_SCALE_INTEGER_MIN = 1;
const LARGE_SCALE_INTEGER_MAX = 10_000_000;
const LARGE_SCALE_DECIMAL_MIN_INT = 1; // as integer part
const LARGE_SCALE_DECIMAL_MAX_INT = 100_000; // as integer part
const LARGE_SCALE_DECIMAL_DIVISOR = 100_000; // to get 5 decimal places
const LARGE_SCALE_HISTORY_LENGTH = 5;


export default function RngExperimentsContainer() {
  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();

  const [usingRandomOrg, setUsingRandomOrg] = useState<boolean>(false);
  const [randomOrgStatusChecked, setRandomOrgStatusChecked] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  // State for Decimal RNG
  const [decimalResult, setDecimalResult] = useState<string>('0.00000');
  const [decimalCounts, setDecimalCounts] = useState<number[]>(Array(NUM_DECIMAL_RNG_BINS).fill(0));
  const [totalDecimalGenerations, setTotalDecimalGenerations] = useState<number>(0);
  const [adminDecimalOverride, setAdminDecimalOverride] = useState<string>('');
  const [isGeneratingDecimal, setIsGeneratingDecimal] = useState<boolean>(false);

  // State for Integer RNG
  const [integerResult, setIntegerResult] = useState<string>('-');
  const [integerCounts, setIntegerCounts] = useState<number[]>(Array(NUM_INTEGER_RNG_BINS).fill(0));
  const [totalIntegerGenerations, setTotalIntegerGenerations] = useState<number>(0);
  const [adminIntegerOverride, setAdminIntegerOverride] = useState<string>('');
  const [isGeneratingInteger, setIsGeneratingInteger] = useState<boolean>(false);

  // State for Normal RNG
  const [normalResult, setNormalResult] = useState<string>('-');
  const [normalCounts, setNormalCounts] = useState<number[]>(Array(normalRngBinRanges.length).fill(0));
  const [totalNormalGenerations, setTotalNormalGenerations] = useState<number>(0);
  const [adminNormalOverride, setAdminNormalOverride] = useState<string>('');
  const [isGeneratingNormal, setIsGeneratingNormal] = useState<boolean>(false);

  // State for Large Scale RNG
  const [largeScaleResult, setLargeScaleResult] = useState<string>('-');
  const [largeScaleHistory, setLargeScaleHistory] = useState<string[]>([]);
  const [totalLargeScaleGenerations, setTotalLargeScaleGenerations] = useState<number>(0);
  const [adminLargeScaleInteger, setAdminLargeScaleInteger] = useState<string>('');
  const [adminLargeScaleDecimal, setAdminLargeScaleDecimal] = useState<string>('');
  const [isGeneratingLargeScale, setIsGeneratingLargeScale] = useState<boolean>(false);


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

  useEffect(() => {
    if (!isAdminMode) {
      setAdminDecimalOverride('');
      setAdminIntegerOverride('');
      setAdminNormalOverride('');
      setAdminLargeScaleInteger('');
      setAdminLargeScaleDecimal('');
    }
  }, [isAdminMode]);

  // Chart data memos
  const decimalChartData: ChartDataItem[] = useMemo(() => decimalRngLabels.map((name, index) => ({ name, value: decimalCounts[index] })), [decimalCounts]);
  const integerChartData: ChartDataItem[] = useMemo(() => integerRngLabels.map((name, index) => ({ name, value: integerCounts[index] })), [integerCounts]);
  const normalChartData: ChartDataItem[] = useMemo(() => normalRngLabels.map((name, index) => ({ name, value: normalCounts[index] })), [normalCounts]);

  // --- Decimal RNG Logic ---
  const handleGenerateDecimal = useCallback(async () => {
    if (isGeneratingDecimal) return;
    setIsGeneratingDecimal(true);
    
    let finalValue: number;
    let binIndex: number;
    const adminOverrideValue = parseInt(adminDecimalOverride, 10);

    if (isClient && isAdminMode && !isNaN(adminOverrideValue) && adminOverrideValue >= 0 && adminOverrideValue < NUM_DECIMAL_RNG_BINS) {
      binIndex = adminOverrideValue;
      finalValue = (binIndex + Math.random()) / NUM_DECIMAL_RNG_BINS;
      finalValue = Math.min(0.99999, Math.max(0, finalValue));
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomDecimalFractions(1, 5);
        finalValue = randomNumbers[0];
        binIndex = Math.floor(finalValue * NUM_DECIMAL_RNG_BINS);
        if (binIndex >= NUM_DECIMAL_RNG_BINS) binIndex = NUM_DECIMAL_RNG_BINS - 1;
      } catch (error) {
        toast({ variant: "destructive", title: "RNG Error", description: "Falling back to standard RNG." });
        finalValue = Math.random();
        binIndex = Math.floor(finalValue * NUM_DECIMAL_RNG_BINS);
        if (binIndex >= NUM_DECIMAL_RNG_BINS) binIndex = NUM_DECIMAL_RNG_BINS - 1;
      }
    } else {
      finalValue = Math.random();
      binIndex = Math.floor(finalValue * NUM_DECIMAL_RNG_BINS);
      if (binIndex >= NUM_DECIMAL_RNG_BINS) binIndex = NUM_DECIMAL_RNG_BINS - 1;
    }
    
    setDecimalResult(finalValue.toFixed(5));
    setDecimalCounts(prev => {
      const newCounts = [...prev];
      newCounts[binIndex]++;
      return newCounts;
    });
    setTotalDecimalGenerations(prev => prev + 1);
    setIsGeneratingDecimal(false);

  }, [isGeneratingDecimal, adminDecimalOverride, isAdminMode, usingRandomOrg, toast, isClient]);


  // --- Integer RNG Logic ---
  const handleGenerateInteger = useCallback(async () => {
    if (isGeneratingInteger) return;
    setIsGeneratingInteger(true);
    setIntegerResult('...');
    
    let finalValue: number;
    const adminOverrideValue = parseInt(adminIntegerOverride, 10);

    if (isClient && isAdminMode && !isNaN(adminOverrideValue) && adminOverrideValue >= 1 && adminOverrideValue <= 100) {
      finalValue = adminOverrideValue;
    } else if (usingRandomOrg) {
      try {
        const randomNumbers = await getRandomIntegers(1, 1, 100);
        finalValue = randomNumbers[0];
      } catch (error) {
        toast({ variant: "destructive", title: "RNG Error", description: "Falling back to standard RNG." });
        finalValue = Math.floor(Math.random() * 100) + 1;
      }
    } else {
      finalValue = Math.floor(Math.random() * 100) + 1;
    }

    const binIndex = Math.floor((finalValue - 1) / 10);

    setIntegerResult(finalValue.toString());
    setIntegerCounts(prev => {
      const newCounts = [...prev];
      newCounts[Math.min(binIndex, NUM_INTEGER_RNG_BINS - 1)]++;
      return newCounts;
    });
    setTotalIntegerGenerations(prev => prev + 1);
    setIsGeneratingInteger(false);

  }, [isGeneratingInteger, adminIntegerOverride, isAdminMode, usingRandomOrg, toast, isClient]);

  // --- Normal RNG Logic (Box-Muller transform for standard normal) ---
  const generateStandardNormal = () => {
    let u1 = 0, u2 = 0;
    // Ensure u1 and u2 are not 0 to avoid issues with Math.log(0)
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
  

  const handleGenerateNormal = useCallback(async () => {
    if (isGeneratingNormal) return;
    setIsGeneratingNormal(true);
    setNormalResult('...');

    let finalValue: number;
    let binIndex: number = -1;
    const adminOverrideValue = parseInt(adminNormalOverride, 10);

    if (isClient && isAdminMode && !isNaN(adminOverrideValue) && adminOverrideValue >= 0 && adminOverrideValue < normalRngBinRanges.length) {
      binIndex = adminOverrideValue;
      const range = normalRngBinRanges[binIndex];
      if (range.min === -Infinity) finalValue = range.max - Math.random() * 0.5;
      else if (range.max === Infinity) finalValue = range.min + Math.random() * 0.5;
      else finalValue = range.min + Math.random() * (range.max - range.min);
    } else {
      finalValue = generateStandardNormal();
      for (let i = 0; i < normalRngBinRanges.length; i++) {
        if (finalValue >= normalRngBinRanges[i].min && finalValue < normalRngBinRanges[i].max) {
          binIndex = i;
          break;
        }
      }
    }
    
    if (binIndex === -1) {
        console.warn("Could not determine bin for Normal RNG value:", finalValue);
        setIsGeneratingNormal(false);
        return;
    }

    setNormalResult(finalValue.toFixed(4));
    setNormalCounts(prev => {
      const newCounts = [...prev];
      newCounts[binIndex]++;
      return newCounts;
    });
    setTotalNormalGenerations(prev => prev + 1);
    setIsGeneratingNormal(false);

  }, [isGeneratingNormal, adminNormalOverride, isAdminMode, isClient]); // Removed usingRandomOrg, toast from deps as it's not using random.org for normal

  // --- Large Scale RNG Logic ---
  const handleGenerateLargeScale = useCallback(async () => {
    if (isGeneratingLargeScale) return;
    setIsGeneratingLargeScale(true);
    setLargeScaleResult("Generating...");

    let integerPart: number;
    let decimalPartInt: number; // Integer representing 1-100,000

    const adminInt = parseInt(adminLargeScaleInteger, 10);
    const adminDecInt = parseInt(adminLargeScaleDecimal, 10);

    const useAdminInt = isClient && isAdminMode && !isNaN(adminInt) && adminInt >= LARGE_SCALE_INTEGER_MIN && adminInt <= LARGE_SCALE_INTEGER_MAX;
    const useAdminDec = isClient && isAdminMode && !isNaN(adminDecInt) && adminDecInt >= LARGE_SCALE_DECIMAL_MIN_INT && adminDecInt <= LARGE_SCALE_DECIMAL_MAX_INT;

    if (useAdminInt) {
      integerPart = adminInt;
    } else if (usingRandomOrg) {
      try {
        const nums = await getRandomIntegers(1, LARGE_SCALE_INTEGER_MIN, LARGE_SCALE_INTEGER_MAX);
        integerPart = nums[0];
      } catch (error) {
        toast({ variant: "destructive", title: "RNG Error", description: "Integer part fallback." });
        integerPart = Math.floor(Math.random() * (LARGE_SCALE_INTEGER_MAX - LARGE_SCALE_INTEGER_MIN + 1)) + LARGE_SCALE_INTEGER_MIN;
      }
    } else {
      integerPart = Math.floor(Math.random() * (LARGE_SCALE_INTEGER_MAX - LARGE_SCALE_INTEGER_MIN + 1)) + LARGE_SCALE_INTEGER_MIN;
    }

    if (useAdminDec) {
      decimalPartInt = adminDecInt;
    } else if (usingRandomOrg) {
      try {
        const nums = await getRandomIntegers(1, LARGE_SCALE_DECIMAL_MIN_INT, LARGE_SCALE_DECIMAL_MAX_INT);
        decimalPartInt = nums[0];
      } catch (error) {
        toast({ variant: "destructive", title: "RNG Error", description: "Decimal part fallback." });
        decimalPartInt = Math.floor(Math.random() * (LARGE_SCALE_DECIMAL_MAX_INT - LARGE_SCALE_DECIMAL_MIN_INT + 1)) + LARGE_SCALE_DECIMAL_MIN_INT;
      }
    } else {
      decimalPartInt = Math.floor(Math.random() * (LARGE_SCALE_DECIMAL_MAX_INT - LARGE_SCALE_DECIMAL_MIN_INT + 1)) + LARGE_SCALE_DECIMAL_MIN_INT;
    }

    const decimalFraction = decimalPartInt / LARGE_SCALE_DECIMAL_DIVISOR;
    const finalNumber = integerPart + decimalFraction;
    const formattedResult = finalNumber.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 });

    setLargeScaleResult(formattedResult);
    setLargeScaleHistory(prev => [formattedResult, ...prev.slice(0, LARGE_SCALE_HISTORY_LENGTH - 1)]);
    setTotalLargeScaleGenerations(prev => prev + 1);
    setIsGeneratingLargeScale(false);

  }, [isGeneratingLargeScale, isAdminMode, adminLargeScaleInteger, adminLargeScaleDecimal, usingRandomOrg, toast, isClient]);


  return (
    <div className="space-y-8">
      {randomOrgStatusChecked && (
        <p className="info-text flex items-center justify-center text-xs mb-6">
          <Info className="w-3 h-3 mr-1" />
          {usingRandomOrg ? 'Using Random.org API for enhanced randomness where applicable.' : 'Using standard pseudo-random generator.'}
          {!usingRandomOrg && process.env.NODE_ENV === 'development' && !process.env.RANDOM_ORG_API_KEY &&
            <span className="ml-1"> (Set RANDOM_ORG_API_KEY in .env to enable Random.org)</span>
          }
        </p>
      )}

      {/* Decimal RNG Section */}
      <div className="p-4 border rounded-lg shadow-md bg-card">
        <h3 className="text-xl font-semibold text-center mb-4 text-primary">Decimal RNG (Uniform 0-1)</h3>
        <div className="control-group">
          <Button onClick={handleGenerateDecimal} disabled={isGeneratingDecimal || !randomOrgStatusChecked}>
            {isGeneratingDecimal ? 'Generating...' : 'Generate Decimal'}
          </Button>
          {isClient && isAdminMode && (
            <div className="flex items-center space-x-2 ml-4">
              <Label htmlFor="adminDecimalOverride" className="text-sm">Admin Bin (0-9):</Label>
              <Input type="number" id="adminDecimalOverride" min="0" max={NUM_DECIMAL_RNG_BINS -1} value={adminDecimalOverride} onChange={(e) => setAdminDecimalOverride(e.target.value)} className="w-24 h-9" disabled={isGeneratingDecimal} placeholder="0-9"/>
            </div>
          )}
        </div>
        <div className="result-display text-2xl font-mono" aria-live="polite">Result: {decimalResult}</div>
        <InteractiveBarChart data={decimalChartData} title="Decimal RNG Distribution (Bins)" />
        <p className="stats-text">Total Generations: {totalDecimalGenerations}</p>
      </div>

      {/* Integer RNG Section */}
      <div className="p-4 border rounded-lg shadow-md bg-card">
        <h3 className="text-xl font-semibold text-center mb-4 text-primary">Integer RNG (1-100)</h3>
        <div className="control-group">
          <Button onClick={handleGenerateInteger} disabled={isGeneratingInteger || !randomOrgStatusChecked}>
            {isGeneratingInteger ? 'Generating...' : 'Generate Integer'}
          </Button>
          {isClient && isAdminMode && (
             <div className="flex items-center space-x-2 ml-4">
              <Label htmlFor="adminIntegerOverride" className="text-sm">Admin # (1-100):</Label>
              <Input type="number" id="adminIntegerOverride" min="1" max="100" value={adminIntegerOverride} onChange={(e) => setAdminIntegerOverride(e.target.value)} className="w-24 h-9" disabled={isGeneratingInteger} placeholder="1-100"/>
            </div>
          )}
        </div>
        <div className="result-display text-2xl" aria-live="polite">Result: {integerResult}</div>
        <InteractiveBarChart data={integerChartData} title="Integer RNG Distribution (Bins)" />
        <p className="stats-text">Total Generations: {totalIntegerGenerations}</p>
      </div>

      {/* Normal RNG Section */}
      <div className="p-4 border rounded-lg shadow-md bg-card">
        <h3 className="text-xl font-semibold text-center mb-4 text-primary">Normal Distribution RNG (μ=0, σ=1)</h3>
        <div className="control-group">
          <Button onClick={handleGenerateNormal} disabled={isGeneratingNormal || !randomOrgStatusChecked}>
           {isGeneratingNormal ? 'Generating...' : 'Generate Normal'}
          </Button>
          {isClient && isAdminMode && (
            <div className="flex items-center space-x-2 ml-4">
              <Label htmlFor="adminNormalOverride" className="text-sm">Admin Bin (0-{normalRngBinRanges.length - 1}):</Label>
              <Input type="number" id="adminNormalOverride" min="0" max={normalRngBinRanges.length - 1} value={adminNormalOverride} onChange={(e) => setAdminNormalOverride(e.target.value)} className="w-24 h-9" disabled={isGeneratingNormal} placeholder={`0-${normalRngBinRanges.length - 1}`}/>
            </div>
          )}
        </div>
        <div className="result-display text-2xl" aria-live="polite">Result: {normalResult}</div>
        <InteractiveBarChart data={normalChartData} title="Normal RNG Distribution (Std. Dev. Bins)" />
        <p className="stats-text">Total Generations: {totalNormalGenerations}</p>
      </div>

      {/* Large Scale RNG Section */}
      <div className="p-4 border rounded-lg shadow-md bg-card">
        <h3 className="text-xl font-semibold text-center mb-4 text-primary">Large Scale RNG (1-10M . 00001-.10000)</h3>
        <div className="control-group">
          <Button onClick={handleGenerateLargeScale} disabled={isGeneratingLargeScale || !randomOrgStatusChecked}>
            {isGeneratingLargeScale ? 'Generating...' : 'Generate Large Scale Number'}
          </Button>
        </div>
        {isClient && isAdminMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 px-2">
                <div>
                    <Label htmlFor="adminLargeScaleInteger" className="text-sm">Admin Integer Part ({LARGE_SCALE_INTEGER_MIN.toLocaleString()}-{LARGE_SCALE_INTEGER_MAX.toLocaleString()}):</Label>
                    <Input type="number" id="adminLargeScaleInteger" value={adminLargeScaleInteger} onChange={(e) => setAdminLargeScaleInteger(e.target.value)} className="w-full h-9 mt-1" disabled={isGeneratingLargeScale} placeholder="e.g., 1234567" min={LARGE_SCALE_INTEGER_MIN} max={LARGE_SCALE_INTEGER_MAX}/>
                </div>
                <div>
                    <Label htmlFor="adminLargeScaleDecimal" className="text-sm">Admin Decimal Part ({LARGE_SCALE_DECIMAL_MIN_INT}-{LARGE_SCALE_DECIMAL_MAX_INT}, as integer):</Label>
                    <Input type="number" id="adminLargeScaleDecimal" value={adminLargeScaleDecimal} onChange={(e) => setAdminLargeScaleDecimal(e.target.value)} className="w-full h-9 mt-1" disabled={isGeneratingLargeScale} placeholder="e.g., 54321 (for .54321)" min={LARGE_SCALE_DECIMAL_MIN_INT} max={LARGE_SCALE_DECIMAL_MAX_INT}/>
                </div>
            </div>
        )}
        <div className="result-display text-2xl font-mono" aria-live="polite">Result: {largeScaleResult}</div>
        <div className="mt-2">
            <h4 className="text-md font-medium text-center mb-1 text-muted-foreground">Recent Generations:</h4>
            {largeScaleHistory.length > 0 ? (
                <ul className="list-none p-0 text-center text-sm text-muted-foreground space-y-1 font-mono">
                    {largeScaleHistory.map((res, idx) => <li key={idx}>{res}</li>)}
                </ul>
            ) : (
                <p className="text-center text-sm text-muted-foreground">No generations yet.</p>
            )}
        </div>
        <p className="stats-text">Total Generations: {totalLargeScaleGenerations}</p>
      </div>

    </div>
  );
}
