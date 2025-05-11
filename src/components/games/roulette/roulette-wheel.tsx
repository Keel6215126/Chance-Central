
"use client";

import type { CSSProperties } from 'react';
import type { RoulettePocket } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RouletteWheelProps {
  currentRotation: number; // in degrees
  isSpinning: boolean;
  pockets: RoulettePocket[]; // Pass pockets data
}

export function RouletteWheel({ currentRotation, isSpinning, pockets }: RouletteWheelProps) {
  const wheelStyle: CSSProperties = {
    transform: `translate(-50%, -50%) rotate(${currentRotation}deg)`,
    transition: isSpinning ? `transform 5000ms cubic-bezier(0.23, 1, 0.32, 1)` : 'none',
  };
  
  const POCKET_ANGLE_STEP = 360 / pockets.length;

  return (
    <div 
      id="rouletteBoard" 
      className="w-[300px] h-[300px] border-[10px] rounded-full mx-auto my-5 relative grid place-items-center overflow-hidden"
      style={{ 
        borderColor: 'var(--roulette-board-border)', 
        backgroundColor: 'var(--roulette-board-bg)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 0 15px rgba(0,0,0,0.3)'
      }}
    >
      <div 
        id="rouletteWheel" 
        className="w-[260px] h-[260px] rounded-full absolute top-1/2 left-1/2"
        style={{
          ...wheelStyle,
          backgroundColor: 'var(--roulette-wheel-bg)',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.7)'
        }}
      >
        {/* Inner wheel styling */}
        <div 
          className="absolute top-[15px] left-[15px] right-[15px] bottom-[15px] rounded-full z-0"
          style={{
            backgroundColor: 'var(--roulette-wheel-inner-bg)',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)'
          }}
        />

        {pockets.map((pocket) => {
          // pocket.originalIndex is its position in the ordered array (0 to 36)
          // This determines its physical angle on the wheel.
          const angle = pocket.originalIndex * POCKET_ANGLE_STEP;
          const pocketStyle: CSSProperties = {
            transform: `rotate(${angle}deg)`, // Rotates the pocket wedge itself
          };
          
          // Counter-rotate the number text so it remains upright relative to the board,
          // regardless of the wheel's spin (currentRotation) and the pocket's wedge rotation (angle).
          // The number needs to be rotated by the negative of the sum of these two angles.
          const numberRotationDeg = -(angle + currentRotation);
          
          const numberStyle: CSSProperties = {
            transform: `translateY(6px) rotate(${numberRotationDeg}deg)`, // Adjusted translateY for better centering
            transition: `transform 0.2s ease-out`, // Smoother transition for number re-orientation
            fontSize: '10px', // Ensure consistent font size
            width: '100%', // Ensure text can center if wider than default
            textAlign: 'center', // Center the text within its div
            lineHeight: '1.2', // Adjust line height for small text
          };

          return (
            <div
              key={pocket.originalIndex} // Use originalIndex for unique key if numbers can repeat (not in standard roulette)
              className={cn(
                "roulette-pocket absolute w-[22.4px] h-[130px] top-1/2 left-1/2 ml-[-11.2px] mt-[-130px] origin-[50%_100%] flex justify-center items-start box-border text-xs font-bold text-white border-r border-[var(--roulette-pocket-border)] z-[1]",
                `bg-roulette-${pocket.color}`, 
                pocket.originalIndex === 0 && "border-l border-[var(--roulette-pocket-border)]" 
              )}
              style={pocketStyle}
              aria-label={`Pocket ${pocket.number}, ${pocket.color}`}
            >
              <div 
                className="pocket-number py-0.5 px-0" // Removed horizontal padding for better centering
                style={numberStyle}
              >
                {pocket.number}
              </div>
            </div>
          );
        })}
      </div>
      
      <div 
        id="rouletteHub" 
        className="w-10 h-10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[3]"
        style={{
          background: 'radial-gradient(ellipse at center, var(--roulette-hub-outer) 0%, var(--roulette-hub-mid1) 30%, var(--roulette-hub-mid2) 60%, var(--roulette-hub-inner) 100%)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.4), inset 0 0 5px rgba(0,0,0,0.2)',
          border: '1px solid var(--roulette-hub-border)'
        }}
      />
      {/* Pointer is at the top (12 o'clock position) of the static board */}
      <div 
        id="roulettePointer" 
        className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] absolute top-[6px] left-1/2 -translate-x-1/2 z-[5]" // Adjusted size and position
        style={{ 
          borderTopColor: 'var(--roulette-pointer-color)',
          filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.7))'
        }}
        aria-hidden="true"
      />
    </div>
  );
}
