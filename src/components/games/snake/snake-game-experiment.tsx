
"use client";

import type { KeyboardEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminMode } from '@/hooks/useAdminMode';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const TILE_COUNT_X = CANVAS_WIDTH / GRID_SIZE;
const TILE_COUNT_Y = CANVAS_HEIGHT / GRID_SIZE;
const INITIAL_SNAKE_GAME_SPEED = 150;


type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;

const initialSnakePosition = (): Position[] => [{ x: Math.floor(TILE_COUNT_X / 2), y: Math.floor(TILE_COUNT_Y / 2) }];

function getRandomPosition(snakeBody: Position[] = []): Position {
  let newPosition;
  do {
    newPosition = {
      x: Math.floor(Math.random() * TILE_COUNT_X),
      y: Math.floor(Math.random() * TILE_COUNT_Y),
    };
  } while (snakeBody.some(segment => segment.x === newPosition.x && segment.y === newPosition.y));
  return newPosition;
}

export default function SnakeGameExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State values - these trigger re-renders
  const [snake, setSnake] = useState<Position[]>(initialSnakePosition());
  const [food, setFood] = useState<Position>(() => getRandomPosition(initialSnakePosition()));
  const [direction, setDirection] = useState<Direction>(null);
  const [pendingDirection, setPendingDirection] = useState<Direction>(null);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<number>(INITIAL_SNAKE_GAME_SPEED);

  const [isAdminMode] = useAdminMode();
  const { toast } = useToast();
  const [adminScore, setAdminScore] = useState<string>("0");
  const [godMode, setGodMode] = useState<boolean>(false);
  const [adminControlledSpeed, setAdminControlledSpeed] = useState<string>(INITIAL_SNAKE_GAME_SPEED.toString());
  const [adminFoodX, setAdminFoodX] = useState<string>('');
  const [adminFoodY, setAdminFoodY] = useState<string>('');
  const [isClient, setIsClient] = useState(false);


  // Refs for mutable values that don't need to trigger re-renders directly in the game loop
  const gameLoopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef(direction);
  const pendingDirectionRef = useRef(pendingDirection);
  const foodRef = useRef(food); // Keep ref in sync with state
  const snakeRef = useRef(snake); // Keep ref in sync with state
  const gameOverRef = useRef(gameOver); // Keep ref in sync with state
  const gameSpeedRef = useRef(gameSpeed); // Keep ref in sync with state
  const godModeRef = useRef(godMode); // Keep ref in sync with state
  const currentScoreRef = useRef(score); // Keep ref in sync with state

  // Sync refs with their corresponding state values whenever state changes
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { pendingDirectionRef.current = pendingDirection; }, [pendingDirection]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);
  useEffect(() => { godModeRef.current = godMode; }, [godMode]);
  useEffect(() => { currentScoreRef.current = score; }, [score]);


  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  const drawSnakeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const snakeGameBg = rootStyles.getPropertyValue('--snake-game-bg').trim() || 'hsl(var(--snake-game-bg-hsl))';
    const snakeColor = rootStyles.getPropertyValue('--snake-color').trim() || 'hsl(var(--primary))';
    const foodColor = rootStyles.getPropertyValue('--snake-food-color').trim() || 'hsl(var(--destructive))';
    const destructiveFg = rootStyles.getPropertyValue('--destructive-foreground').trim() || 'white';

    ctx.fillStyle = snakeGameBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw food (circle)
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    ctx.arc(
      foodRef.current.x * GRID_SIZE + GRID_SIZE / 2,
      foodRef.current.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2.5, // Slightly smaller radius for better look
      0, 2 * Math.PI
    );
    ctx.fill();

    // Draw snake
    ctx.fillStyle = snakeColor;
    snakeRef.current.forEach((segment, index) => {
      const segX = segment.x * GRID_SIZE;
      const segY = segment.y * GRID_SIZE;
      const cornerRadius = GRID_SIZE / 4; // Adjust for desired roundness

      drawRoundedRect(ctx, segX + 2, segY + 2, GRID_SIZE - 4, GRID_SIZE - 4, cornerRadius);

      if (index === 0) { // Draw eyes on the head
        const eyeSize = GRID_SIZE / 4.5;
        const eyeRadius = eyeSize / 2;
        ctx.fillStyle = '#FFF'; // Eye white color

        const headCenterX = segX + GRID_SIZE / 2;
        const headCenterY = segY + GRID_SIZE / 2;
        
        let eye1OffsetX = 0, eye1OffsetY = 0, eye2OffsetX = 0, eye2OffsetY = 0;
        const eyeDist = GRID_SIZE * 0.2; // Distance from center for eyes

        const currentDir = directionRef.current || pendingDirectionRef.current || 'RIGHT'; // Default to RIGHT if no direction yet

        switch (currentDir) {
          case 'RIGHT': eye1OffsetX = eyeDist; eye1OffsetY = -eyeDist; eye2OffsetX = eyeDist; eye2OffsetY = eyeDist; break;
          case 'LEFT':  eye1OffsetX = -eyeDist; eye1OffsetY = -eyeDist; eye2OffsetX = -eyeDist; eye2OffsetY = eyeDist; break;
          case 'DOWN':  eye1OffsetX = -eyeDist; eye1OffsetY = eyeDist; eye2OffsetX = eyeDist; eye2OffsetY = eyeDist; break;
          case 'UP':    eye1OffsetX = -eyeDist; eye1OffsetY = -eyeDist; eye2OffsetX = eyeDist; eye2OffsetY = -eyeDist; break;
        }
        
        ctx.beginPath(); ctx.arc(headCenterX + eye1OffsetX, headCenterY + eye1OffsetY, eyeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(headCenterX + eye2OffsetX, headCenterY + eye2OffsetY, eyeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = snakeColor; // Reset to snake color for next segment
      }
    });

    if (gameOverRef.current) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.font = "bold 40px sans-serif";
        ctx.fillStyle = destructiveFg;
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.font = "24px sans-serif";
        ctx.fillText(`Score: ${currentScoreRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  }, []); // Dependencies managed by refs mostly, drawing depends on current ref values.

  const initSnakeGame = useCallback(() => {
    if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    
    const initialSnake = initialSnakePosition();
    setSnake(initialSnake);
    const initialFood = getRandomPosition(initialSnake);
    setFood(initialFood);
    
    setDirection(null);
    setPendingDirection(null);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setGameSpeed(INITIAL_SNAKE_GAME_SPEED);

    // Admin related resets
    setAdminScore("0");
    if (!isAdminMode) { 
        setGodMode(false);
    }
    setAdminControlledSpeed(INITIAL_SNAKE_GAME_SPEED.toString());
    setAdminFoodX('');
    setAdminFoodY('');

    // Initial draw
    drawSnakeGame();
  }, [isAdminMode, drawSnakeGame]);

  useEffect(() => {
    setIsClient(true);
    initSnakeGame(); // Initialize on mount
  }, [initSnakeGame]);


  const startGame = useCallback(() => {
    if (gameOverRef.current) { // If restarting after game over
      initSnakeGame(); // Re-initialize first
      // Use a short timeout to ensure state updates from initSnakeGame are processed
      // before trying to start the game loop and set initial direction.
      setTimeout(() => {
        setGameStarted(true);
        if (!pendingDirectionRef.current && !directionRef.current) {
           setDirection('RIGHT'); // Default start direction
        }
        // Game loop will be started by the useEffect watching gameStarted and gameOver
      }, 50);
    } else if (!gameStarted) { // If starting for the first time
        setGameStarted(true);
        if (!pendingDirectionRef.current && !directionRef.current) {
            setDirection('RIGHT'); // Default start direction
        }
        // Game loop will be started by the useEffect watching gameStarted and gameOver
    }
  }, [initSnakeGame, gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!gameStarted && !gameOverRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        startGame(); // Auto-start game on first valid key press if not started
      }

      let newDirIntent: Direction = null;
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': newDirIntent = 'UP'; break;
        case 'arrowdown': case 's': newDirIntent = 'DOWN'; break;
        case 'arrowleft': case 'a': newDirIntent = 'LEFT'; break;
        case 'arrowright': case 'd': newDirIntent = 'RIGHT'; break;
        default: return;
      }
      e.preventDefault();

      const currentDir = directionRef.current; // Use ref for current direction
      // Prevent immediate 180-degree turns
      if (currentDir === 'UP' && newDirIntent === 'DOWN') return;
      if (currentDir === 'DOWN' && newDirIntent === 'UP') return;
      if (currentDir === 'LEFT' && newDirIntent === 'RIGHT') return;
      if (currentDir === 'RIGHT' && newDirIntent === 'LEFT') return;
      
      setPendingDirection(newDirIntent); // Update state to queue direction change
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, startGame]); // startGame is a dependency now


  // Main game loop effect
  useEffect(() => {
    if (!gameStarted || gameOverRef.current) {
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
      return; // Stop loop if game not started or is over
    }

    const tick = () => {
      if (gameOverRef.current) { // Double check gameOver status inside tick
        if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
        drawSnakeGame(); // Draw final game over screen
        return;
      }

      // Process pending direction
      if (pendingDirectionRef.current) {
         // Check again to prevent 180 turns based on the *actual* current direction
        const canChange = !((directionRef.current === 'UP' && pendingDirectionRef.current === 'DOWN') ||
                              (directionRef.current === 'DOWN' && pendingDirectionRef.current === 'UP') ||
                              (directionRef.current === 'LEFT' && pendingDirectionRef.current === 'RIGHT') ||
                              (directionRef.current === 'RIGHT' && pendingDirectionRef.current === 'LEFT'));
        if (canChange) {
          setDirection(pendingDirectionRef.current); // Update state: actual direction
        }
        setPendingDirection(null); // Clear pending direction state
      }
      
      // If no direction is set (e.g. at the very start before first key press after start), don't move
      if (!directionRef.current) {
        gameLoopTimeoutRef.current = setTimeout(tick, gameSpeedRef.current);
        drawSnakeGame(); // Keep drawing while waiting for first move
        return;
      }

      // Update snake position based on directionRef.current
      setSnake(prevSnake => {
        if (prevSnake.length === 0) { // Should not happen with proper init
            setGameOver(true); 
            return prevSnake;
        }
        let newSnakeHead = { ...prevSnake[0] };
        switch (directionRef.current) { // Use ref here
          case 'UP': newSnakeHead.y -= 1; break;
          case 'DOWN': newSnakeHead.y += 1; break;
          case 'LEFT': newSnakeHead.x -= 1; break;
          case 'RIGHT': newSnakeHead.x += 1; break;
        }

        // Wall collision / God mode
        if (!godModeRef.current && (newSnakeHead.x < 0 || newSnakeHead.x >= TILE_COUNT_X || newSnakeHead.y < 0 || newSnakeHead.y >= TILE_COUNT_Y)) {
          setGameOver(true);
          return prevSnake;
        }
        if (godModeRef.current) { // Wrap around
            if (newSnakeHead.x < 0) newSnakeHead.x = TILE_COUNT_X - 1;
            else if (newSnakeHead.x >= TILE_COUNT_X) newSnakeHead.x = 0;
            if (newSnakeHead.y < 0) newSnakeHead.y = TILE_COUNT_Y - 1;
            else if (newSnakeHead.y >= TILE_COUNT_Y) newSnakeHead.y = 0;
        }

        // Self collision
        if (!godModeRef.current) {
            for (let i = 0; i < prevSnake.length; i++) { // Check against all segments including current head before move
              if (prevSnake[i].x === newSnakeHead.x && prevSnake[i].y === newSnakeHead.y) {
                setGameOver(true);
                return prevSnake;
              }
            }
        }
        
        const nextSnake = [newSnakeHead, ...prevSnake];
        let foodEaten = false;

        if (newSnakeHead.x === foodRef.current.x && newSnakeHead.y === foodRef.current.y) {
          setScore(s => s + 1);
          
          const newFoodPos = getRandomPosition(nextSnake); // Pass nextSnake to avoid placing food under new head
          setFood(newFoodPos);
          
          if (adminControlledSpeed === gameSpeedRef.current.toString()) { // Only adjust speed if admin isn't overriding
            const newSpeedVal = Math.max(50, gameSpeedRef.current - 2); // Speed up
            setGameSpeed(newSpeedVal);
          }
          foodEaten = true;
        }

        if (!foodEaten) {
          nextSnake.pop(); // Remove tail if no food eaten
        }
        return nextSnake; // Return new snake state
      });

      // Schedule next tick
      if (!gameOverRef.current) { // Check gameOverRef again before scheduling next tick
         gameLoopTimeoutRef.current = setTimeout(tick, gameSpeedRef.current);
      } else {
         if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
      }
      drawSnakeGame(); // Draw after each logic update
    };

    // Start the loop
    if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    gameLoopTimeoutRef.current = setTimeout(tick, gameSpeedRef.current); // Initial call to tick

    return () => { // Cleanup
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    };
  }, [gameStarted, drawSnakeGame]); // Effect dependencies: gameStarted will trigger loop start/stop

  // Effect for drawing based on state changes (snake, food, gameOver, score)
  useEffect(() => {
    drawSnakeGame();
  }, [snake, food, gameOver, score, drawSnakeGame]); // Redraw when these change

  useEffect(() => {
    if (!isAdminMode) { // Reset admin-specific settings if admin mode is turned off
      setAdminScore("0");
      setGodMode(false);
      // Reset speed to initial only if it was admin controlled
      if (adminControlledSpeed !== gameSpeedRef.current.toString()){
         setAdminControlledSpeed(gameSpeedRef.current.toString());
      }
      setAdminFoodX('');
      setAdminFoodY('');
    }
  }, [isAdminMode, adminControlledSpeed]); // Rerun if isAdminMode or adminControlledSpeed changes.

  const handleSetAdminScore = () => {
    const newScore = parseInt(adminScore, 10);
    if (!isNaN(newScore) && newScore >= 0) {
      setScore(newScore);
      toast({ title: "Admin Action", description: `Score set to ${newScore}` });
    } else {
      toast({ variant: "destructive", title: "Admin Error", description: "Invalid score value." });
    }
  };

  const handleSetAdminSpeed = () => {
    const newSpeed = parseInt(adminControlledSpeed, 10);
    if (!isNaN(newSpeed) && newSpeed >= 30 && newSpeed <= 1000) {
      setGameSpeed(newSpeed); // Update gameSpeed state, ref will update via its useEffect
      toast({ title: "Admin Action", description: `Game speed set to ${newSpeed}ms` });
    } else {
      toast({ variant: "destructive", title: "Admin Error", description: "Invalid speed (30-1000ms)." });
      setAdminControlledSpeed(gameSpeedRef.current.toString());
    }
  };

  const handleSetAdminFoodPosition = () => {
    const x = parseInt(adminFoodX, 10);
    const y = parseInt(adminFoodY, 10);
    if (!isNaN(x) && !isNaN(y) && x >= 0 && x < TILE_COUNT_X && y >= 0 && y < TILE_COUNT_Y) {
      const newFoodPos = { x, y };
      // Check if new food position is on the snake
      if (snakeRef.current.some(segment => segment.x === newFoodPos.x && segment.y === newFoodPos.y)) {
          toast({ variant: "destructive", title: "Admin Error", description: "Cannot place food on the snake." });
          return;
      }
      setFood(newFoodPos); // Update food state, ref will update via its useEffect
      drawSnakeGame(); // Redraw immediately
      toast({ title: "Admin Action", description: `Food moved to (${x}, ${y})` });
    } else {
      toast({ variant: "destructive", title: "Admin Error", description: `Invalid food position (X: 0-${TILE_COUNT_X-1}, Y: 0-${TILE_COUNT_Y-1}).` });
    }
  };
  
  const handleGodModeToggle = (checked: boolean) => {
    setGodMode(checked); // Update godMode state, ref will update via its useEffect
    toast({ title: "Admin Action", description: `God mode ${checked ? 'enabled' : 'disabled'}.` });
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-2xl font-semibold" aria-live="polite">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-border rounded-md shadow-lg bg-[var(--snake-game-bg)]"
        aria-label="Snake game board"
      />
      <div className="flex flex-wrap items-center justify-center gap-4">
        {(!gameStarted || gameOver) && (
          <Button onClick={startGame} aria-label={gameOver ? "Restart Game" : "Start Game"}>
            {gameOver ? "Restart Game" : "Start Game"}
          </Button>
        )}
         {gameStarted && !gameOver && (
          <Button onClick={() => {setGameOver(true);}} variant="outline" size="sm" aria-label="End Game">End Game</Button>
        )}
      </div>
      {isClient && isAdminMode && (
        <div className="control-group mt-4 p-4 border rounded-md w-full max-w-md space-y-3 bg-card">
          <h4 className="text-lg font-medium text-center mb-2 text-primary">Admin Controls (Snake)</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="godModeSwitch" className="text-sm">God Mode (No Collisions):</Label>
            <Switch id="godModeSwitch" checked={godMode} onCheckedChange={handleGodModeToggle} />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="adminSnakeScore" className="text-sm flex-shrink-0">Set Score:</Label>
            <Input
              type="number"
              id="adminSnakeScore"
              value={adminScore}
              onChange={(e) => setAdminScore(e.target.value)}
              className="w-full h-9"
              placeholder="Score"
              min="0"
            />
            <Button onClick={handleSetAdminScore} size="sm" className="h-9">Set</Button>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="adminGameSpeed" className="text-sm flex-shrink-0">Set Speed (ms):</Label>
            <Input
              type="number"
              id="adminGameSpeed"
              value={adminControlledSpeed}
              onChange={(e) => setAdminControlledSpeed(e.target.value)}
              className="w-full h-9"
              placeholder="30-1000"
              min="30" max="1000"
            />
            <Button onClick={handleSetAdminSpeed} size="sm" className="h-9">Set</Button>
          </div>
           <div className="flex items-center space-x-2">
            <Label className="text-sm flex-shrink-0">Set Food Pos (X,Y):</Label>
            <Input
              type="number"
              id="adminFoodX"
              value={adminFoodX}
              onChange={(e) => setAdminFoodX(e.target.value)}
              className="w-1/2 h-9"
              placeholder={`X (0-${TILE_COUNT_X-1})`}
              min="0" max={TILE_COUNT_X-1}
            />
            <Input
              type="number"
              id="adminFoodY"
              value={adminFoodY}
              onChange={(e) => setAdminFoodY(e.target.value)}
              className="w-1/2 h-9"
              placeholder={`Y (0-${TILE_COUNT_Y-1})`}
               min="0" max={TILE_COUNT_Y-1}
            />
            <Button onClick={handleSetAdminFoodPosition} size="sm" className="h-9">Set</Button>
          </div>
        </div>
      )}
      <p className="info-text text-xs">Use Arrow Keys or WASD to control the snake.</p>
    </div>
  );
}
